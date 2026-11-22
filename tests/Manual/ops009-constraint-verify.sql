\set ON_ERROR_STOP on

-- The copied constraint uses the genuine PostgreSQL CHECK implementation,
-- but no custody rows, authorization records, or persistent tables are altered.
BEGIN;
CREATE TEMP TABLE ops009_constraint_probe
    (LIKE legacy_custody.operations INCLUDING CONSTRAINTS) ON COMMIT DROP;

DO $ops009$
DECLARE
    kind text;
    action_name text;
    failure_constraint text;
    allowed_count integer := 0;
    rejected_count integer := 0;
BEGIN
    FOR kind, action_name IN
        SELECT * FROM (VALUES
            ('transaction_create', 'create'),
            ('correspondence_register', 'register'),
            ('correspondence_classify', 'classify'),
            ('correspondence_route', 'route'),
            ('correspondence_act', 'act'),
            ('travel_record', 'record'),
            ('travel_status', 'status'),
            ('transaction_transition', 'forward'),
            ('transaction_transition', 'send_to_mayor'),
            ('transaction_transition', 'return_origin'),
            ('transaction_transition', 'request_information'),
            ('transaction_transition', 'assign'),
            ('transaction_transition', 'mark_review'),
            ('transaction_transition', 'approve'),
            ('transaction_transition', 'disapprove'),
            ('transaction_transition', 'close')
        ) AS valid(kind, action_name)
    LOOP
        INSERT INTO ops009_constraint_probe (
            operation_id, namespace_id, epoch, actor_user_id, office_id,
            service_identity, command_kind, command_action, correlation_id,
            idempotency_hash, item_count, manifest_digest
        ) VALUES (
            gen_random_uuid(), gen_random_uuid(), 1, 1, 1,
            'ops009-disposable-constraint-probe', kind, action_name, gen_random_uuid(),
            repeat('a', 64), 1, repeat('b', 64)
        );
        allowed_count := allowed_count + 1;
    END LOOP;

    FOR kind, action_name IN
        SELECT * FROM (VALUES
            ('transaction_create', 'close'),
            ('transaction_transition', 'sign'),
            ('transaction_transition', 'unknown'),
            ('unknown', 'close'),
            ('correspondence_route', 'close'),
            ('travel_status', 'approve'),
            ('transaction_transition', 'Close')
        ) AS invalid(kind, action_name)
    LOOP
        BEGIN
            INSERT INTO ops009_constraint_probe (
                operation_id, namespace_id, epoch, actor_user_id, office_id,
                service_identity, command_kind, command_action, correlation_id,
                idempotency_hash, item_count, manifest_digest
            ) VALUES (
                gen_random_uuid(), gen_random_uuid(), 1, 1, 1,
                'ops009-disposable-constraint-probe', kind, action_name, gen_random_uuid(),
                repeat('a', 64), 1, repeat('b', 64)
            );
            RAISE EXCEPTION 'Unauthorized command combination accepted: %/%',
                kind, action_name;
        EXCEPTION WHEN check_violation THEN
            GET STACKED DIAGNOSTICS failure_constraint = CONSTRAINT_NAME;
            IF failure_constraint <> 'operations_check' THEN
                RAISE EXCEPTION 'Wrong CHECK blocked invalid command: %', failure_constraint;
            END IF;
            rejected_count := rejected_count + 1;
        END;
    END LOOP;
    IF allowed_count <> 16 OR rejected_count <> 7 THEN
        RAISE EXCEPTION 'OPS009 tuple totals incorrect: % accepted / % rejected',
            allowed_count, rejected_count;
    END IF;
    RAISE NOTICE 'OPS009_COMMAND_CONTRACT_ACCEPTED=%', allowed_count;
    RAISE NOTICE 'OPS009_COMMAND_CONTRACT_REJECTED=%', rejected_count;
END
$ops009$;
ROLLBACK;
