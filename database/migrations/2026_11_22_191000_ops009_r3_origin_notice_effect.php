<?php

declare(strict_types=1);

use App\Deployment\PersistentInstaller;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public $withinTransaction = true;

    public function up(): void
    {
        // Experimental, disposable-PG16-only R3 path; no production upgrade.
        if (! PersistentInstaller::active() && (! app()->environment('testing')
            || getenv('N03_DISPOSABLE_LEASE') !== 'EXCLUSIVE_PG16_SYNTHETIC_ONLY'
            || DB::getDriverName() !== 'pgsql'
            || DB::connection()->getDatabaseName() !== 'talibon_portal_test')) {
            throw new RuntimeException('OPS009 R3 origin notice requires exclusive disposable PG16 testing lease.');
        }

        DB::transaction(static function (): void {
            $pre = DB::selectOne(<<<'SQL'
                SELECT current_database() AS database_name,
                       current_setting('server_version_num')::integer AS version_number,
                       current_setting('is_superuser') AS superuser,
                       session_user AS session_role,
                       current_user AS execution_role,
                       pg_get_userbyid(p.relowner) AS notification_owner,
                       pg_get_userbyid(a.relowner) AS audit_binding_owner,
                       (SELECT count(*) FROM public.migrations
                        WHERE migration='2026_11_22_190000_ops009_r3_close_audit_provenance') AS audit_migration,
                       (SELECT count(*) FROM pg_catalog.pg_trigger
                        WHERE tgrelid='public.audit_logs'::regclass
                          AND tgname='ops009_close_audit_integrity'
                          AND tgdeferrable AND tginitdeferred AND tgenabled='O') AS deferred_audit,
                       (SELECT count(*) FROM pg_catalog.pg_constraint
                        WHERE conrelid='public.platform_notifications'::regclass
                          AND conname='platform_notifications_user_id_event_key_unique'
                          AND contype='u') AS user_event_unique,
                       to_regprocedure('public.ops009_guard_close_notice()') IS NULL AS new_function,
                       (SELECT count(*) FROM pg_catalog.pg_trigger
                        WHERE tgrelid='public.platform_notifications'::regclass
                          AND tgname='ops009_origin_close_notice_guard') AS existing_trigger
                FROM pg_catalog.pg_class p
                CROSS JOIN pg_catalog.pg_class a
                WHERE p.oid='public.platform_notifications'::regclass
                  AND a.oid='public.ops009_close_audit_bindings'::regclass
                SQL);
            if ($pre === null
                || $pre->database_name !== PersistentInstaller::database()
                || (int) $pre->version_number < 160000 || (int) $pre->version_number >= 170000
                || $pre->superuser !== 'on'
                || $pre->session_role !== PersistentInstaller::bootstrapRole() || $pre->execution_role !== PersistentInstaller::bootstrapRole()
                || $pre->notification_owner !== 'kirion_g1b_owner'
                || $pre->audit_binding_owner !== 'kirion_g1b_owner'
                || (int) $pre->audit_migration !== 1 || (int) $pre->deferred_audit !== 1
                || (int) $pre->user_event_unique !== 1
                || ! $pre->new_function || (int) $pre->existing_trigger !== 0) {
                throw new RuntimeException('OPS009 R3 origin notice refused schema, role or provenance drift.');
            }

            DB::unprepared(<<<'SQL'
                -- Enforce source, eligible origin recipient, event key and content
                -- inside the n03_command transaction. No default-connection
                -- listener, outbox, post-commit callback or unbounded INSERT.
                CREATE FUNCTION public.ops009_guard_close_notice() RETURNS trigger
                LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $guard$
                DECLARE matched integer;
                BEGIN
                    IF current_user<>'n03_command' OR session_user<>'n03_command' THEN
                        RETURN NEW; -- Ordinary existing notifier unchanged.
                    END IF;

                    SELECT count(*) INTO matched
                    FROM public.ops009_close_audit_bindings b
                    JOIN legacy_custody.command_results cr ON cr.operation_id=b.operation_id
                    JOIN legacy_custody.terminal_receipts tr ON tr.operation_id=b.operation_id
                    JOIN legacy_custody.operations o ON o.operation_id=b.operation_id
                    JOIN public.transaction_events ev ON ev.id=b.transaction_event_id
                    JOIN public.transactions tx ON tx.id=b.transaction_id
                    JOIN public.audit_logs audit ON audit.id=b.audit_id
                    JOIN public.departments dep ON dep.id=tx.origin_department_id
                    JOIN public.employees emp
                      ON emp.department_id=dep.id
                     AND emp.user_id=NEW.user_id
                     AND emp.user_id=tx.created_by_user_id
                    JOIN public.users usr ON usr.id=NEW.user_id
                    WHERE cr.source_kind='transaction' AND cr.event_action='close'
                      AND cr.source_id=tx.id AND cr.transaction_event_id=ev.id
                      AND cr.actor_user_id=o.actor_user_id
                      AND cr.office_id=o.office_id
                      AND cr.correlation_id=o.correlation_id
                      AND o.command_kind='transaction_transition' AND o.command_action='close'
                      AND tr.outcome='COMMITTED' AND tr.fence_no=1
                      AND ev.transaction_id=tx.id AND ev.action='close'
                      AND audit.entity_type='App\Models\WorkflowTransaction'
                      AND audit.entity_id=tx.id AND audit.action='transaction.close'
                      AND audit.actor_user_id=o.actor_user_id
                      AND audit.actor_department_id=o.office_id
                      AND audit.correlation_id=o.correlation_id
                      AND usr.is_active AND usr.account_status='active'
                      AND usr.suspended_at IS NULL
                      AND emp.employment_status='active'
                      AND emp.separation_date IS NULL
                      AND dep.is_active AND dep.is_routable
                      AND NEW.department_id=dep.id
                      AND NEW.event_key='transaction-event-'||ev.id::text
                      AND NEW.source_domain='transaction'
                      AND NEW.source_type='App\Models\WorkflowTransaction'
                      AND NEW.source_id=tx.id
                      AND NEW.priority='action_required'
                      AND NEW.title='Transaction completed'
                      AND NEW.message=tx.reference_no||' · '||tx.title
                      AND NEW.action_url='/transactions/'||tx.id::text
                      AND NEW.requires_acknowledgement IS FALSE
                      AND NEW.read_at IS NULL AND NEW.acknowledged_at IS NULL
                      AND NEW.expires_at IS NULL;
                    IF matched<>1 THEN
                        RAISE EXCEPTION 'OPS009 origin notice lacks verified close receipt or eligible recipient' USING ERRCODE='23514';
                    END IF;
                    RETURN NEW;
                END $guard$;

                CREATE TRIGGER ops009_origin_close_notice_guard
                    BEFORE INSERT ON public.platform_notifications
                    FOR EACH ROW EXECUTE FUNCTION public.ops009_guard_close_notice();

                ALTER FUNCTION public.ops009_guard_close_notice() OWNER TO kirion_g1b_owner;
                REVOKE ALL ON FUNCTION public.ops009_guard_close_notice() FROM PUBLIC;
                GRANT INSERT(
                    user_id,department_id,event_key,source_domain,source_type,source_id,
                    priority,title,message,action_url,requires_acknowledgement,created_at,updated_at
                ) ON public.platform_notifications TO n03_command;
                GRANT SELECT(user_id,event_key) ON public.platform_notifications TO n03_command;
                GRANT USAGE ON SEQUENCE public.platform_notifications_id_seq TO n03_command;
                SQL);

            $post = DB::selectOne(<<<'SQL'
                SELECT
                  (SELECT count(*) FROM pg_catalog.pg_trigger
                     WHERE tgrelid='public.platform_notifications'::regclass
                       AND tgname='ops009_origin_close_notice_guard'
                       AND tgenabled='O') AS guard_count,
                  has_any_column_privilege('n03_command','public.platform_notifications','INSERT') AS inserts,
                  has_column_privilege('n03_command','public.platform_notifications','user_id','SELECT') AS key_user_read,
                  has_column_privilege('n03_command','public.platform_notifications','event_key','SELECT') AS key_event_read,
                  has_column_privilege('n03_command','public.platform_notifications','message','SELECT') AS message_read,
                  has_sequence_privilege('n03_command','public.platform_notifications_id_seq','USAGE') AS seq_usage,
                  has_any_column_privilege('n03_command','public.platform_notifications','UPDATE') AS updates,
                  has_table_privilege('n03_command','public.platform_notifications','DELETE') AS deletes,
                  pg_get_userbyid(p.proowner) AS function_owner,
                  p.prosecdef AS security_definer,
                  p.proconfig::text AS function_settings
                FROM pg_catalog.pg_proc p
                WHERE p.oid='public.ops009_guard_close_notice()'::regprocedure
                SQL);
            if ($post === null
                || (int) $post->guard_count !== 1
                || ! $post->inserts || ! $post->seq_usage
                || ! $post->key_user_read || ! $post->key_event_read || $post->message_read
                || $post->updates || $post->deletes
                || $post->function_owner !== 'kirion_g1b_owner'
                || (bool) $post->security_definer
                || ! str_contains((string) $post->function_settings, 'search_path=pg_catalog')) {
                throw new RuntimeException('OPS009 R3 origin notice guard postcondition failed.');
            }
        });
    }

    public function down(): void
    {
        throw new RuntimeException('OPS009 R3 origin notice spike is forward-only; destroy the disposable test database.');
    }
};
