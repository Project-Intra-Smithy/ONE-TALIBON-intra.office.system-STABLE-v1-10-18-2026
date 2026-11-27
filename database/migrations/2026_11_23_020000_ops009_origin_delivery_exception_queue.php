<?php

declare(strict_types=1);

use App\Deployment\PersistentInstaller;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Synthetic-only, forward-only OPS009 delivery-gap queue. A real municipality
 * must separately ratify its office custodians and operational SLAs before
 * applying this contract to persistent data.
 */
return new class extends Migration
{
    public $withinTransaction = true;

    public function up(): void
    {
        if (! PersistentInstaller::active() && (! app()->environment('testing')
            || getenv('N03_DISPOSABLE_LEASE') !== 'EXCLUSIVE_PG16_SYNTHETIC_ONLY'
            || DB::getDriverName() !== 'pgsql'
            || DB::connection()->getDatabaseName() !== 'talibon_portal_test')) {
            throw new RuntimeException('OPS009 exception queue requires leased disposable PostgreSQL 16.');
        }

        $guard = DB::selectOne(<<<'SQL'
            SELECT current_database() AS db,
                   current_setting('server_version_num')::integer AS version,
                   current_setting('is_superuser') AS superuser,
                   session_user AS session_role, current_user AS execution_role,
                   to_regclass('public.ops009_close_audit_bindings') IS NOT NULL AS audit_ready,
                   to_regprocedure('public.ops009_guard_close_notice()') IS NOT NULL AS notice_ready,
                   to_regclass('public.ops009_origin_delivery_exceptions') IS NULL AS tables_absent,
                   (SELECT count(*) FROM pg_roles WHERE rolname IN
                       ('n03_command','kirion_g1b_owner','kirion_g1b_app')) AS roles_ready
            SQL);

        if ($guard === null || $guard->db !== PersistentInstaller::database()
            || (int) $guard->version < 160000 || (int) $guard->version >= 170000
            || $guard->superuser !== 'on'
            || $guard->session_role !== PersistentInstaller::bootstrapRole()
            || $guard->execution_role !== PersistentInstaller::bootstrapRole()
            || ! $guard->audit_ready || ! $guard->notice_ready
            || ! $guard->tables_absent || (int) $guard->roles_ready !== 3) {
            throw new RuntimeException('OPS009 delivery-gap migration refused authority, role or schema drift.');
        }

        DB::transaction(static function (): void {
            DB::unprepared(<<<'SQL'
                CREATE TABLE public.ops009_origin_delivery_exceptions (
                    id bigserial PRIMARY KEY,
                    operation_id uuid NOT NULL UNIQUE
                        REFERENCES legacy_custody.operations(operation_id) ON DELETE RESTRICT,
                    transaction_id bigint NOT NULL UNIQUE
                        REFERENCES public.transactions(id) ON DELETE RESTRICT,
                    transaction_event_id bigint NOT NULL UNIQUE
                        REFERENCES public.transaction_events(id) ON DELETE RESTRICT,
                    origin_department_id bigint NOT NULL
                        REFERENCES public.departments(id) ON DELETE RESTRICT,
                    reason text NOT NULL DEFAULT 'NO_ELIGIBLE_ORIGIN_RECIPIENT'
                        CHECK(reason='NO_ELIGIBLE_ORIGIN_RECIPIENT'),
                    custodian_role text NOT NULL DEFAULT 'department_head'
                        CHECK(custodian_role='department_head'),
                    created_at timestamptz NOT NULL DEFAULT now()
                );

                CREATE TABLE public.ops009_origin_delivery_exception_actions (
                    id bigserial PRIMARY KEY,
                    exception_id bigint NOT NULL
                        REFERENCES public.ops009_origin_delivery_exceptions(id) ON DELETE RESTRICT,
                    actor_user_id bigint NOT NULL
                        REFERENCES public.users(id) ON DELETE RESTRICT,
                    actor_department_id bigint NOT NULL
                        REFERENCES public.departments(id) ON DELETE RESTRICT,
                    action text NOT NULL CHECK(action IN ('acknowledge','resolve')),
                    note text NOT NULL CHECK(length(btrim(note)) BETWEEN 1 AND 2000),
                    created_at timestamptz NOT NULL DEFAULT now(),
                    UNIQUE(exception_id,action)
                );

                -- Exceptions are only minted by the N03 command role, for the
                -- exact committed close event/receipt and an eligible origin
                -- office Head. A mere seeded office or technical admin is
                -- never accepted as an operational escalation custodian.
                CREATE FUNCTION public.ops009_guard_delivery_exception() RETURNS trigger
                LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $fn$
                DECLARE n integer;
                BEGIN
                    IF current_user <> 'n03_command'
                       OR session_user <> 'n03_command' THEN
                        RAISE EXCEPTION 'OPS009 delivery gap requires N03 command identity'
                            USING ERRCODE='23514';
                    END IF;

                    SELECT count(*) INTO n
                    FROM public.ops009_close_audit_bindings b
                    JOIN legacy_custody.operations o ON o.operation_id=b.operation_id
                    JOIN legacy_custody.command_results cr ON cr.operation_id=o.operation_id
                    JOIN legacy_custody.terminal_receipts tr ON tr.operation_id=o.operation_id
                    JOIN public.transactions tx ON tx.id=b.transaction_id
                    JOIN public.transaction_events ev ON ev.id=b.transaction_event_id
                    WHERE NEW.operation_id=o.operation_id
                      AND NEW.transaction_id=b.transaction_id
                      AND NEW.transaction_event_id=ev.id
                      AND NEW.origin_department_id=tx.origin_department_id
                      AND o.command_kind='transaction_transition'
                      AND o.command_action='close'
                      AND cr.source_kind='transaction'
                      AND cr.event_action='close'
                      AND cr.transaction_event_id=ev.id
                      AND tr.outcome='COMMITTED' AND tr.fence_no=1
                      AND ev.action='close' AND ev.transaction_id=tx.id
                      AND tx.status='closed'
                      AND NEW.reason='NO_ELIGIBLE_ORIGIN_RECIPIENT'
                      AND NEW.custodian_role='department_head'
                      AND NOT EXISTS (
                          SELECT 1 FROM public.platform_notifications pn
                           WHERE pn.event_key='transaction-event-'||ev.id::text
                      )
                      AND EXISTS (
                          SELECT 1
                            FROM public.users head
                            JOIN public.employees emp ON emp.user_id=head.id
                            JOIN public.departments dep ON dep.id=emp.department_id
                           WHERE emp.department_id=tx.origin_department_id
                             AND head.role='department_head'
                             AND head.is_active
                             AND head.account_status='active'
                             AND head.suspended_at IS NULL
                             AND emp.employment_status='active'
                             AND emp.separation_date IS NULL
                             AND dep.is_active AND dep.is_routable
                      );
                    IF n<>1 THEN
                        RAISE EXCEPTION 'OPS009 delivery gap has no verified event or eligible custodian'
                            USING ERRCODE='23514';
                    END IF;
                    RETURN NEW;
                END $fn$;

                CREATE TRIGGER ops009_delivery_exception_guard
                BEFORE INSERT ON public.ops009_origin_delivery_exceptions
                FOR EACH ROW EXECUTE FUNCTION public.ops009_guard_delivery_exception();

                CREATE FUNCTION public.ops009_guard_delivery_action() RETURNS trigger
                LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $fn$
                DECLARE n integer;
                BEGIN
                    SELECT count(*) INTO n
                      FROM public.ops009_origin_delivery_exceptions gap
                      JOIN public.users head ON head.id=NEW.actor_user_id
                      JOIN public.employees emp ON emp.user_id=head.id
                      JOIN public.departments dep ON dep.id=emp.department_id
                     WHERE gap.id=NEW.exception_id
                       AND gap.origin_department_id=NEW.actor_department_id
                       AND emp.department_id=gap.origin_department_id
                       AND head.role='department_head' AND head.is_active
                       AND head.account_status='active' AND head.suspended_at IS NULL
                       AND emp.employment_status='active' AND emp.separation_date IS NULL
                       AND dep.is_active AND dep.is_routable
                       AND (
                           NEW.action='acknowledge'
                           OR EXISTS (
                               SELECT 1 FROM public.ops009_origin_delivery_exception_actions a
                                WHERE a.exception_id=gap.id AND a.action='acknowledge'
                           )
                       );
                    IF n<>1 THEN
                        RAISE EXCEPTION 'OPS009 exception action requires eligible origin Head and prior acknowledgment'
                            USING ERRCODE='23514';
                    END IF;
                    RETURN NEW;
                END $fn$;

                CREATE TRIGGER ops009_delivery_action_guard
                BEFORE INSERT ON public.ops009_origin_delivery_exception_actions
                FOR EACH ROW EXECUTE FUNCTION public.ops009_guard_delivery_action();

                CREATE FUNCTION public.ops009_deny_exception_mutation() RETURNS trigger
                LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $fn$
                BEGIN
                    RAISE EXCEPTION 'OPS009 delivery exception ledger is append-only'
                        USING ERRCODE='23514';
                END $fn$;

                CREATE TRIGGER ops009_exception_append_only
                  BEFORE UPDATE OR DELETE ON public.ops009_origin_delivery_exceptions
                  FOR EACH ROW EXECUTE FUNCTION public.ops009_deny_exception_mutation();
                CREATE TRIGGER ops009_exception_action_append_only
                  BEFORE UPDATE OR DELETE ON public.ops009_origin_delivery_exception_actions
                  FOR EACH ROW EXECUTE FUNCTION public.ops009_deny_exception_mutation();

                ALTER TABLE public.ops009_origin_delivery_exceptions OWNER TO kirion_g1b_owner;
                ALTER TABLE public.ops009_origin_delivery_exception_actions OWNER TO kirion_g1b_owner;
                ALTER SEQUENCE public.ops009_origin_delivery_exceptions_id_seq OWNER TO kirion_g1b_owner;
                ALTER SEQUENCE public.ops009_origin_delivery_exception_actions_id_seq OWNER TO kirion_g1b_owner;
                ALTER FUNCTION public.ops009_guard_delivery_exception() OWNER TO kirion_g1b_owner;
                ALTER FUNCTION public.ops009_guard_delivery_action() OWNER TO kirion_g1b_owner;
                ALTER FUNCTION public.ops009_deny_exception_mutation() OWNER TO kirion_g1b_owner;
                REVOKE ALL ON public.ops009_origin_delivery_exceptions FROM PUBLIC;
                REVOKE ALL ON public.ops009_origin_delivery_exception_actions FROM PUBLIC;
                REVOKE ALL ON FUNCTION public.ops009_guard_delivery_exception() FROM PUBLIC;
                REVOKE ALL ON FUNCTION public.ops009_guard_delivery_action() FROM PUBLIC;
                REVOKE ALL ON FUNCTION public.ops009_deny_exception_mutation() FROM PUBLIC;

                GRANT INSERT(operation_id,transaction_id,transaction_event_id,origin_department_id)
                    ON public.ops009_origin_delivery_exceptions TO n03_command;
                GRANT USAGE ON SEQUENCE public.ops009_origin_delivery_exceptions_id_seq TO n03_command;

                GRANT SELECT ON public.ops009_origin_delivery_exceptions TO kirion_g1b_app;
                GRANT SELECT ON public.ops009_origin_delivery_exception_actions TO kirion_g1b_app;
                GRANT INSERT(exception_id,actor_user_id,actor_department_id,action,note)
                    ON public.ops009_origin_delivery_exception_actions TO kirion_g1b_app;
                GRANT USAGE ON SEQUENCE public.ops009_origin_delivery_exception_actions_id_seq TO kirion_g1b_app;
                SQL);
        });
    }

    public function down(): void
    {
        throw new RuntimeException('OPS009 exception queue is forward-only; destroy disposable PG16 fixture.');
    }
};
