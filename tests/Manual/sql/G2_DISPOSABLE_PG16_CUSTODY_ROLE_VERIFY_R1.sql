-- Execute as the disposable bootstrap superuser after the G2 role extension.
\set ON_ERROR_STOP on
BEGIN;
SET LOCAL statement_timeout = '30s';

SET LOCAL ROLE kirion_g1b_app;
DO $app_denied$
BEGIN
  BEGIN PERFORM count(*) FROM public.plan_custody_generations;
    RAISE EXCEPTION 'ordinary app read custody metadata';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS app custody SELECT denied SQLSTATE %', SQLSTATE;
  END;
  BEGIN INSERT INTO public.plan_custody_events(
      plan_custody_generation_id,event_id,event_type,actor_id,office_id,service_identity)
      VALUES (1,'30000000-0000-4000-8000-000000000001','INVALID','app','app','app');
    RAISE EXCEPTION 'ordinary app inserted custody evidence';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS app custody INSERT denied SQLSTATE %', SQLSTATE;
  END;
END $app_denied$;
RESET ROLE;

SET LOCAL ROLE kirion_g1b_custody;
INSERT INTO public.plan_custody_generations(
  generation_id,storage_disk,storage_locator,sha256,size_bytes,media_type,
  custody_state,integrity_status,idempotency_key_hash,actor_id,office_id,service_identity)
VALUES ('30000000-0000-4000-8000-000000000002','plan_custody',
  'quarantine/30/30000000-0000-4000-8000-000000000002.pdf',repeat('a',64),12,
  'application/pdf','QUARANTINED','VERIFIED',repeat('b',64),'synthetic-actor',
  'synthetic-office','synthetic-custody');
INSERT INTO public.plan_custody_events(
  plan_custody_generation_id,event_id,event_type,actor_id,office_id,service_identity)
SELECT id,'30000000-0000-4000-8000-000000000003','GENERATION_QUARANTINED',
  'synthetic-actor','synthetic-office','synthetic-custody'
FROM public.plan_custody_generations
WHERE generation_id='30000000-0000-4000-8000-000000000002';
INSERT INTO public.plan_custody_scan_evidence(
  plan_custody_generation_id,evidence_id,decision,scanner_identity,engine_version,
  signature_version,scanned_sha256,scanned_size_bytes,evidence_signature_hash,trusted,scanned_at)
SELECT id,'30000000-0000-4000-8000-000000000004','CLEAN','synthetic-scanner',
  'engine-1','sig-1',sha256,size_bytes,repeat('c',64),true,now()
FROM public.plan_custody_generations
WHERE generation_id='30000000-0000-4000-8000-000000000002';
DO $custody_denied$
BEGIN
  BEGIN UPDATE public.plan_custody_generations SET storage_locator='tampered' WHERE false;
    RAISE EXCEPTION 'custody has UPDATE privilege';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS custody metadata UPDATE denied SQLSTATE %', SQLSTATE;
  END;
  BEGIN DELETE FROM public.plan_custody_events WHERE false;
    RAISE EXCEPTION 'custody has DELETE privilege';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS custody evidence DELETE denied SQLSTATE %', SQLSTATE;
  END;
END $custody_denied$;
RESET ROLE;

SET LOCAL ROLE kirion_g1b_repair;
DO $repair_denied$
BEGIN
  BEGIN UPDATE public.plan_custody_generations SET custody_state='QUARANTINED' WHERE false;
    RAISE EXCEPTION 'repair mutated custody metadata';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS repair custody mutation denied SQLSTATE %', SQLSTATE;
  END;
END $repair_denied$;
RESET ROLE;

ROLLBACK;
SELECT 'G2_DISPOSABLE_CUSTODY_ROLE_MATRIX_VERIFIED_AND_ROLLED_BACK' AS result;
