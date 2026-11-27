-- Shared privilege policy; entrypoints validate target and prerequisites.
REVOKE ALL ON public.plan_custody_generations,
  public.plan_custody_scan_evidence, public.plan_custody_events FROM PUBLIC;
REVOKE ALL ON public.plan_custody_generations,
  public.plan_custody_scan_evidence, public.plan_custody_events
  FROM kirion_g1b_app, kirion_g1b_repair;
REVOKE ALL ON SEQUENCE public.plan_custody_generations_id_seq,
  public.plan_custody_scan_evidence_id_seq, public.plan_custody_events_id_seq
  FROM PUBLIC, kirion_g1b_app, kirion_g1b_repair;

GRANT SELECT, INSERT ON public.plan_custody_generations,
  public.plan_custody_scan_evidence, public.plan_custody_events TO kirion_g1b_custody;
GRANT USAGE, SELECT ON SEQUENCE public.plan_custody_generations_id_seq,
  public.plan_custody_scan_evidence_id_seq, public.plan_custody_events_id_seq
  TO kirion_g1b_custody;

DO $verify$
DECLARE bad integer;
BEGIN
  IF has_table_privilege('kirion_g1b_app','public.plan_custody_generations','SELECT')
     OR has_table_privilege('kirion_g1b_app','public.plan_custody_events','INSERT')
     OR has_table_privilege('kirion_g1b_repair','public.plan_custody_generations','UPDATE')
     OR NOT has_table_privilege('kirion_g1b_custody','public.plan_custody_generations','SELECT')
     OR NOT has_table_privilege('kirion_g1b_custody','public.plan_custody_scan_evidence','INSERT')
     OR has_table_privilege('kirion_g1b_custody','public.plan_custody_generations','UPDATE')
     OR has_table_privilege('kirion_g1b_custody','public.plan_custody_events','DELETE') THEN
    RAISE EXCEPTION 'G2 custody role matrix violated';
  END IF;

  SELECT count(*) INTO bad FROM pg_proc p
   WHERE p.pronamespace='public'::regnamespace
     AND p.proname IN ('kirion_plan_custody_generation_guard',
       'kirion_plan_custody_append_only_guard','kirion_plan_custody_scan_guard')
     AND (p.proowner <> 'kirion_g1b_owner'::regrole OR p.prosecdef
       OR has_function_privilege('kirion_g1b_app',p.oid,'EXECUTE')
       OR has_function_privilege('kirion_g1b_custody',p.oid,'EXECUTE'));
  IF bad <> 0 THEN
    RAISE EXCEPTION 'G2 custody function owner/ACL boundary violated: %', bad;
  END IF;
END $verify$;

