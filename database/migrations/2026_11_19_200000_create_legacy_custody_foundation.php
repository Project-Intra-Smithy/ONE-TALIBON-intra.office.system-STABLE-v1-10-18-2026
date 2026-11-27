<?php

declare(strict_types=1);

use App\Deployment\PersistentInstaller;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (! PersistentInstaller::active() && (! app()->environment('testing') || getenv('N03_DISPOSABLE_LEASE') !== 'EXCLUSIVE_PG16_SYNTHETIC_ONLY'
            || DB::getDriverName() !== 'pgsql' || DB::connection()->getDatabaseName() !== 'talibon_portal_test')) {
            throw new RuntimeException('N03 requires a leased synthetic PG16 database.');
        }
        $guard = DB::selectOne("SELECT current_database() AS db, current_setting('server_version_num')::integer AS version, current_setting('is_superuser') AS bootstrap, to_regnamespace('legacy_custody') IS NULL AS absent");
        if ($guard->db !== PersistentInstaller::database() || $guard->version < 160000 || $guard->version >= 170000 || $guard->bootstrap !== 'on' || ! $guard->absent) {
            throw new RuntimeException('N03 migration environment or schema drift.');
        }
        DB::unprepared(<<<'SQL'

CREATE SCHEMA legacy_custody;
REVOKE ALL ON SCHEMA legacy_custody FROM PUBLIC;
CREATE TABLE legacy_custody.namespaces (
 namespace_id uuid PRIMARY KEY, backend_kind text NOT NULL CHECK (backend_kind <> ''),
 provider_identity text NOT NULL CHECK (provider_identity <> ''), root_claim text NOT NULL CHECK (root_claim <> ''),
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(backend_kind,provider_identity), UNIQUE(backend_kind,root_claim)
);
CREATE TABLE legacy_custody.operations (
 operation_id uuid PRIMARY KEY, namespace_id uuid NOT NULL REFERENCES legacy_custody.namespaces ON DELETE RESTRICT,
 epoch bigint NOT NULL CHECK(epoch>0), actor_user_id bigint NOT NULL REFERENCES public.users ON DELETE RESTRICT,
 office_id bigint NOT NULL REFERENCES public.departments ON DELETE RESTRICT,
 service_identity text NOT NULL CHECK(service_identity <> ''), command_kind text NOT NULL, command_action text NOT NULL,
 correlation_id uuid NOT NULL, idempotency_hash text NOT NULL CHECK(idempotency_hash ~ '^[0-9a-f]{64}$'),
 item_count integer NOT NULL CHECK(item_count BETWEEN 1 AND 5), manifest_digest text NOT NULL CHECK(manifest_digest ~ '^[0-9a-f]{64}$'),
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK ((command_kind,command_action) IN (('transaction_create','create'),('correspondence_register','register'),
 ('correspondence_classify','classify'),('correspondence_route','route'),('correspondence_act','act'),('travel_record','record'),('travel_status','status'))
 OR (command_kind='transaction_transition' AND command_action IN ('forward','send_to_mayor','return_origin','request_information','assign','mark_review','approve','disapprove'))),
 UNIQUE(namespace_id,actor_user_id,office_id,service_identity,command_kind,idempotency_hash),
 UNIQUE(operation_id,namespace_id,epoch), UNIQUE(operation_id,actor_user_id,office_id,correlation_id)
);
CREATE TABLE legacy_custody.operation_items (
 operation_id uuid NOT NULL, ordinal integer NOT NULL CHECK(ordinal BETWEEN 1 AND 5), generation_id uuid NOT NULL UNIQUE,
 namespace_id uuid NOT NULL, epoch bigint NOT NULL, locator text NOT NULL,
 size_bytes bigint NOT NULL CHECK(size_bytes BETWEEN 1 AND 15728640), sha256 text NOT NULL CHECK(sha256 ~ '^[0-9a-f]{64}$'),
 mime_type text NOT NULL CHECK(mime_type IN ('application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/jpeg','image/png','image/webp')),
 PRIMARY KEY(operation_id,ordinal), UNIQUE(namespace_id,locator),
 CHECK(locator='objects/'||left(generation_id::text,2)||'/'||generation_id::text||'.blob'),
 FOREIGN KEY(operation_id,namespace_id,epoch) REFERENCES legacy_custody.operations(operation_id,namespace_id,epoch) ON DELETE RESTRICT,
 UNIQUE(operation_id,ordinal,generation_id,namespace_id,epoch,locator,size_bytes,sha256,mime_type)
);
CREATE TABLE legacy_custody.operation_gates (
 operation_id uuid PRIMARY KEY REFERENCES legacy_custody.operations ON DELETE RESTRICT,
 fence_no bigint NOT NULL DEFAULT 1, state text NOT NULL DEFAULT 'OPEN', lock_stub integer NOT NULL DEFAULT 0 CHECK(lock_stub=0),
 CHECK((state='OPEN' AND fence_no=1) OR (state='CLOSED' AND fence_no=2))
);
CREATE TABLE legacy_custody.generations (
 generation_id uuid PRIMARY KEY, operation_id uuid NOT NULL, ordinal integer NOT NULL, namespace_id uuid NOT NULL, epoch bigint NOT NULL,
 locator text NOT NULL, size_bytes bigint NOT NULL, sha256 text NOT NULL, mime_type text NOT NULL,
 provider_object_identity text NOT NULL CHECK(provider_object_identity<>''), staged_fence bigint NOT NULL CHECK(staged_fence=1),
 staging_receipt_id uuid NOT NULL UNIQUE, verified_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(namespace_id,provider_object_identity), UNIQUE(namespace_id,locator), UNIQUE(operation_id,ordinal,generation_id),
 FOREIGN KEY(operation_id,ordinal,generation_id,namespace_id,epoch,locator,size_bytes,sha256,mime_type)
 REFERENCES legacy_custody.operation_items(operation_id,ordinal,generation_id,namespace_id,epoch,locator,size_bytes,sha256,mime_type) ON DELETE RESTRICT
);
ALTER TABLE public.transaction_events ADD CONSTRAINT n03_transaction_event_tuple UNIQUE(id,transaction_id,actor_user_id,action);
ALTER TABLE public.correspondence_events ADD COLUMN n03_municipal_actor boolean GENERATED ALWAYS AS (integration_client_actor_id IS NULL) STORED;
ALTER TABLE public.correspondence_events ADD CONSTRAINT n03_correspondence_event_tuple UNIQUE(id,correspondence_record_id,actor_user_id,event,office_department_id,correlation_id,n03_municipal_actor);
ALTER TABLE public.travel_order_events ADD CONSTRAINT n03_travel_event_tuple UNIQUE(id,travel_order_id,actor_user_id,event);
CREATE TABLE legacy_custody.command_results (
 operation_id uuid PRIMARY KEY, fence_no bigint NOT NULL CHECK(fence_no=1), source_kind text NOT NULL CHECK(source_kind IN ('transaction','correspondence','travel')),
 source_id bigint NOT NULL, event_id bigint NOT NULL, actor_user_id bigint NOT NULL, office_id bigint NOT NULL, correlation_id uuid NOT NULL,
 event_action varchar(64) NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 transaction_id bigint GENERATED ALWAYS AS (CASE WHEN source_kind='transaction' THEN source_id END) STORED,
 transaction_event_id bigint GENERATED ALWAYS AS (CASE WHEN source_kind='transaction' THEN event_id END) STORED,
 correspondence_id bigint GENERATED ALWAYS AS (CASE WHEN source_kind='correspondence' THEN source_id END) STORED,
 correspondence_event_id bigint GENERATED ALWAYS AS (CASE WHEN source_kind='correspondence' THEN event_id END) STORED,
 travel_id bigint GENERATED ALWAYS AS (CASE WHEN source_kind='travel' THEN source_id END) STORED,
 travel_event_id bigint GENERATED ALWAYS AS (CASE WHEN source_kind='travel' THEN event_id END) STORED,
 municipal_actor boolean GENERATED ALWAYS AS (CASE WHEN source_kind='correspondence' THEN true END) STORED,
 FOREIGN KEY(operation_id,actor_user_id,office_id,correlation_id) REFERENCES legacy_custody.operations(operation_id,actor_user_id,office_id,correlation_id) ON DELETE RESTRICT,
 FOREIGN KEY(transaction_id) REFERENCES public.transactions ON DELETE RESTRICT,
 FOREIGN KEY(transaction_event_id,transaction_id,actor_user_id,event_action) REFERENCES public.transaction_events(id,transaction_id,actor_user_id,action) ON DELETE RESTRICT,
 FOREIGN KEY(correspondence_id) REFERENCES public.correspondence_records ON DELETE RESTRICT,
 FOREIGN KEY(correspondence_event_id,correspondence_id,actor_user_id,event_action,office_id,correlation_id,municipal_actor)
 REFERENCES public.correspondence_events(id,correspondence_record_id,actor_user_id,event,office_department_id,correlation_id,n03_municipal_actor) ON DELETE RESTRICT,
 FOREIGN KEY(travel_id) REFERENCES public.travel_orders ON DELETE RESTRICT,
 FOREIGN KEY(travel_event_id,travel_id,actor_user_id,event_action) REFERENCES public.travel_order_events(id,travel_order_id,actor_user_id,event) ON DELETE RESTRICT
);
ALTER TABLE public.documents ADD COLUMN custody_mode text NOT NULL DEFAULT 'LEGACY_PATH',
 ADD COLUMN custody_operation_id uuid, ADD COLUMN custody_ordinal integer,
 ADD CONSTRAINT n03_mode_check CHECK (
 (custody_mode='LEGACY_PATH' AND custody_operation_id IS NULL AND custody_ordinal IS NULL AND storage_disk<>'legacy_registry_v1')
 OR (custody_mode='REGISTRY_V1' AND custody_operation_id IS NOT NULL AND custody_ordinal IS NOT NULL
 AND security_domain IS NOT NULL AND security_domain='LEGACY_CTW' AND storage_disk='legacy_registry_v1' AND storage_path IS NULL
 AND owner_department_id IS NOT NULL AND uploaded_by_user_id IS NOT NULL AND size_bytes IS NOT NULL AND size_bytes BETWEEN 1 AND 15728640
 AND checksum_sha256 IS NOT NULL AND checksum_sha256 ~ '^[0-9a-f]{64}$' AND mime_type IS NOT NULL
 AND mime_type IN ('application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/jpeg','image/png','image/webp'))),
 ADD CONSTRAINT n03_document_item FOREIGN KEY(custody_operation_id,custody_ordinal) REFERENCES legacy_custody.operation_items ON DELETE RESTRICT,
 ADD CONSTRAINT n03_document_item_unique UNIQUE(custody_operation_id,custody_ordinal),
 ADD CONSTRAINT n03_document_op_unique UNIQUE(id,custody_operation_id),
 ADD CONSTRAINT n03_document_binding_tuple UNIQUE(id,public_id,custody_operation_id,custody_ordinal);
ALTER TABLE public.document_links ADD CONSTRAINT n03_link_tuple UNIQUE(id,document_id,linkable_type,linkable_id,relationship,created_by_user_id);
ALTER TABLE public.audit_logs ADD COLUMN custody_operation_id uuid,
 ADD CONSTRAINT n03_audit_marked CHECK(custody_operation_id IS NULL OR (entity_id IS NOT NULL AND actor_user_id IS NOT NULL
 AND actor_department_id IS NOT NULL AND correlation_id IS NOT NULL AND entity_type IS NOT NULL AND entity_type='document'
 AND action='document.uploaded' AND outcome='allowed' AND integration_client_id IS NULL)),
 ADD CONSTRAINT n03_audit_document FOREIGN KEY(entity_id,custody_operation_id) REFERENCES public.documents(id,custody_operation_id) ON DELETE RESTRICT,
 ADD CONSTRAINT n03_audit_tuple UNIQUE(id,custody_operation_id,entity_id);
CREATE UNIQUE INDEX n03_one_marked_upload ON public.audit_logs(entity_id) WHERE custody_operation_id IS NOT NULL;
CREATE TABLE legacy_custody.bindings (
 document_id bigint PRIMARY KEY, document_public_id uuid NOT NULL, generation_id uuid NOT NULL UNIQUE,
 operation_id uuid NOT NULL REFERENCES legacy_custody.command_results ON DELETE RESTRICT, ordinal integer NOT NULL,
 fence_no bigint NOT NULL CHECK(fence_no=1), upload_audit_id bigint NOT NULL UNIQUE, UNIQUE(operation_id,ordinal),
 FOREIGN KEY(document_id,document_public_id,operation_id,ordinal) REFERENCES public.documents(id,public_id,custody_operation_id,custody_ordinal) ON DELETE RESTRICT,
 FOREIGN KEY(operation_id,ordinal,generation_id) REFERENCES legacy_custody.generations(operation_id,ordinal,generation_id) ON DELETE RESTRICT,
 FOREIGN KEY(upload_audit_id,operation_id,document_id) REFERENCES public.audit_logs(id,custody_operation_id,entity_id) ON DELETE RESTRICT
);
CREATE TABLE legacy_custody.ownership_links (
 binding_document_id bigint NOT NULL REFERENCES legacy_custody.bindings ON DELETE RESTRICT,
 public_document_link_id bigint NOT NULL UNIQUE, linkable_type varchar(160) NOT NULL, source_id bigint NOT NULL,
 relationship varchar(64) NOT NULL, created_by_user_id bigint NOT NULL,
 PRIMARY KEY(binding_document_id,linkable_type,source_id,relationship),
 FOREIGN KEY(public_document_link_id,binding_document_id,linkable_type,source_id,relationship,created_by_user_id)
 REFERENCES public.document_links(id,document_id,linkable_type,linkable_id,relationship,created_by_user_id) ON DELETE RESTRICT
);
CREATE TABLE legacy_custody.terminal_receipts (
 operation_id uuid PRIMARY KEY REFERENCES legacy_custody.operations ON DELETE RESTRICT,
 outcome text NOT NULL, fence_no bigint NOT NULL, receipt_uuid uuid NOT NULL UNIQUE,
 manifest_digest text NOT NULL CHECK(manifest_digest ~ '^[0-9a-f]{64}$'), evidence_ref text NOT NULL CHECK(evidence_ref <> ''),
 actor_user_id bigint NOT NULL REFERENCES public.users ON DELETE RESTRICT, service_identity text NOT NULL CHECK(service_identity <> ''),
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK((outcome='COMMITTED' AND fence_no=1) OR (outcome='ABORTED' AND fence_no=2))
);
CREATE TABLE legacy_custody.operation_events (
 event_id uuid PRIMARY KEY, operation_id uuid NOT NULL REFERENCES legacy_custody.operations ON DELETE RESTRICT,
 fence_no bigint NOT NULL CHECK(fence_no IN (1,2)), kind text NOT NULL, evidence_ref text NOT NULL CHECK(evidence_ref<>''),
 occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX n03_generation_operation ON legacy_custody.generations(operation_id);
CREATE INDEX n03_operation_event_operation ON legacy_custody.operation_events(operation_id);
CREATE INDEX n03_marked_audit_operation ON public.audit_logs(custody_operation_id) WHERE custody_operation_id IS NOT NULL;

-- Every authority-bearing writer uses the same lock. The second query is
-- intentionally separate and VOLATILE at READ COMMITTED after any wait.
CREATE FUNCTION legacy_custody.lock_pending(op uuid, expected bigint, wanted text) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $f$
BEGIN
 IF current_setting('transaction_isolation') <> 'read committed' THEN
  RAISE EXCEPTION 'unsupported custody isolation' USING ERRCODE='23514';
 END IF;
 PERFORM 1 FROM legacy_custody.operation_gates WHERE operation_id=op FOR UPDATE;
 IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM legacy_custody.operation_gates WHERE operation_id=op AND fence_no=expected AND state=wanted)
 OR EXISTS(SELECT 1 FROM legacy_custody.terminal_receipts WHERE operation_id=op) THEN
  RAISE EXCEPTION 'custody fence unavailable' USING ERRCODE='23514';
 END IF;
END $f$;

CREATE FUNCTION legacy_custody.zero_artifacts(op uuid) RETURNS boolean
LANGUAGE sql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $f$
 SELECT NOT row_security_active('public.documents'::regclass)
 AND NOT row_security_active('public.document_links'::regclass)
 AND NOT row_security_active('public.audit_logs'::regclass)
 AND NOT EXISTS (SELECT 1 FROM legacy_custody.command_results WHERE operation_id=op)
 AND NOT EXISTS (SELECT 1 FROM legacy_custody.bindings WHERE operation_id=op)
 AND NOT EXISTS (SELECT 1 FROM public.documents WHERE custody_operation_id=op)
 AND NOT EXISTS (SELECT 1 FROM public.audit_logs WHERE custody_operation_id=op)
$f$;

CREATE FUNCTION legacy_custody.expected_links(op uuid) RETURNS TABLE(linkable_type text,source_id bigint,relationship text)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog AS $f$
 SELECT CASE r.source_kind WHEN 'transaction' THEN 'App\Models\WorkflowTransaction' WHEN 'correspondence' THEN 'App\Models\CorrespondenceRecord' ELSE 'App\Models\TravelOrder' END,
 r.source_id,'supporting_document'::text
 FROM legacy_custody.command_results r JOIN legacy_custody.operations o USING(operation_id)
 WHERE r.operation_id=op AND o.command_kind IN ('transaction_create','correspondence_register','travel_record')
 UNION ALL
 SELECT CASE r.source_kind WHEN 'transaction' THEN 'App\Models\TransactionEvent' WHEN 'correspondence' THEN 'App\Models\CorrespondenceEvent' ELSE 'App\Models\TravelOrderEvent' END,
 r.event_id,CASE WHEN o.command_kind IN ('transaction_create','correspondence_route') OR
 (o.command_kind='transaction_transition' AND o.command_action IN ('forward','send_to_mayor','return_origin','request_information'))
 THEN 'route_evidence' ELSE 'action_evidence' END
 FROM legacy_custody.command_results r JOIN legacy_custody.operations o USING(operation_id) WHERE r.operation_id=op
$f$;
CREATE FUNCTION legacy_custody.private_guard() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $f$
DECLARE op uuid; o legacy_custody.operations%ROWTYPE; role_name text:=current_user; expected_action text; expected_family text;
BEGIN
 IF TG_TABLE_NAME='namespaces' THEN
  IF TG_OP='INSERT' AND role_name NOT IN ('n03_stage','n03_command','n03_reconcile','kirion_g1b_app','kirion_g1b_custody') THEN RETURN NEW; END IF;
  RAISE EXCEPTION 'immutable namespace' USING ERRCODE='23514';
 END IF;
 IF TG_OP='DELETE' OR (TG_OP='UPDATE' AND TG_TABLE_NAME<>'operation_gates') THEN
  RAISE EXCEPTION 'immutable custody tuple' USING ERRCODE='23514';
 END IF;
 IF TG_TABLE_NAME='operation_gates' AND TG_OP='UPDATE' THEN
  IF role_name<>'n03_reconcile' OR OLD.state<>'OPEN' OR OLD.fence_no<>1 OR NEW.state<>'CLOSED' OR NEW.fence_no<>2
  OR NEW.operation_id<>OLD.operation_id OR NEW.lock_stub<>OLD.lock_stub THEN RAISE EXCEPTION 'invalid gate transition' USING ERRCODE='23514'; END IF;
  PERFORM legacy_custody.lock_pending(OLD.operation_id,1,'OPEN');
  IF NOT legacy_custody.zero_artifacts(OLD.operation_id) THEN RAISE EXCEPTION 'nonzero command artifacts' USING ERRCODE='23514'; END IF;
  RETURN NEW;
 END IF;
 IF current_setting('transaction_isolation')<>'read committed' THEN RAISE EXCEPTION 'unsupported custody isolation' USING ERRCODE='23514'; END IF;
 IF TG_TABLE_NAME='ownership_links' THEN
  SELECT operation_id INTO op FROM legacy_custody.bindings WHERE document_id=NEW.binding_document_id;
 ELSE op:=NEW.operation_id;
 END IF;
 IF TG_TABLE_NAME IN ('operations','operation_items','operation_gates','generations') AND role_name<>'n03_stage' THEN
  RAISE EXCEPTION 'stage role required' USING ERRCODE='42501';
 END IF;
 IF TG_TABLE_NAME IN ('command_results','bindings','ownership_links') AND role_name<>'n03_command' THEN
  RAISE EXCEPTION 'command role required' USING ERRCODE='42501';
 END IF;
 IF TG_TABLE_NAME='operations' THEN RETURN NEW; END IF;
 SELECT * INTO o FROM legacy_custody.operations WHERE operation_id=op;
 IF NOT FOUND THEN RAISE EXCEPTION 'missing reservation' USING ERRCODE='23514'; END IF;
 IF TG_TABLE_NAME='operation_items' THEN
  IF NEW.ordinal>o.item_count OR EXISTS(SELECT 1 FROM legacy_custody.operation_gates WHERE operation_id=op) THEN RAISE EXCEPTION 'reservation sealed' USING ERRCODE='23514'; END IF;
 ELSIF TG_TABLE_NAME='operation_gates' THEN
  IF NEW.fence_no<>1 OR NEW.state<>'OPEN' OR (SELECT count(*) FROM legacy_custody.operation_items WHERE operation_id=op)<>o.item_count THEN
   RAISE EXCEPTION 'reservation incomplete' USING ERRCODE='23514'; END IF;
 ELSIF TG_TABLE_NAME='generations' THEN
  PERFORM legacy_custody.lock_pending(op,NEW.staged_fence,'OPEN');
 ELSIF TG_TABLE_NAME='command_results' THEN
  PERFORM legacy_custody.lock_pending(op,NEW.fence_no,'OPEN');
  expected_family:=split_part(o.command_kind,'_',1);
  expected_action:=CASE o.command_kind WHEN 'transaction_create' THEN 'submitted' WHEN 'transaction_transition' THEN o.command_action
   WHEN 'correspondence_register' THEN 'registered' WHEN 'correspondence_classify' THEN 'classified'
   WHEN 'correspondence_route' THEN 'routed' WHEN 'correspondence_act' THEN 'in_action'
   WHEN 'travel_record' THEN 'recorded_approved' WHEN 'travel_status' THEN 'status_changed' END;
  IF NEW.source_kind IS DISTINCT FROM expected_family OR NEW.event_action IS DISTINCT FROM expected_action THEN
   RAISE EXCEPTION 'command source mismatch' USING ERRCODE='23514'; END IF;
 ELSIF TG_TABLE_NAME IN ('bindings','ownership_links') THEN
  PERFORM legacy_custody.lock_pending(op,1,'OPEN');
 ELSIF TG_TABLE_NAME='terminal_receipts' THEN
  IF NEW.manifest_digest IS DISTINCT FROM o.manifest_digest OR NEW.actor_user_id IS DISTINCT FROM o.actor_user_id
   OR NEW.service_identity IS DISTINCT FROM o.service_identity THEN RAISE EXCEPTION 'receipt tuple mismatch' USING ERRCODE='23514'; END IF;
  IF NEW.outcome='COMMITTED' AND role_name='n03_command' THEN
   PERFORM legacy_custody.lock_pending(op,NEW.fence_no,'OPEN');
   IF (SELECT count(*) FROM legacy_custody.bindings WHERE operation_id=op)<>o.item_count THEN
    RAISE EXCEPTION 'premature terminal' USING ERRCODE='23514'; END IF;
  ELSIF NEW.outcome='ABORTED' AND role_name='n03_reconcile' THEN
   PERFORM legacy_custody.lock_pending(op,NEW.fence_no,'CLOSED');
   IF NOT legacy_custody.zero_artifacts(op) THEN RAISE EXCEPTION 'nonzero abort artifacts' USING ERRCODE='23514'; END IF;
  ELSE RAISE EXCEPTION 'receipt role mismatch' USING ERRCODE='42501'; END IF;
 ELSIF TG_TABLE_NAME='operation_events' THEN
  IF role_name='n03_stage' AND NEW.kind IN ('RESERVED','STAGED') THEN PERFORM legacy_custody.lock_pending(op,NEW.fence_no,'OPEN');
  ELSIF role_name='n03_command' AND NEW.kind='COMMAND_READY' THEN PERFORM legacy_custody.lock_pending(op,NEW.fence_no,'OPEN');
  ELSIF role_name='n03_reconcile' AND NEW.kind='CLOSED_WITNESS' THEN PERFORM legacy_custody.lock_pending(op,NEW.fence_no,'CLOSED');
  ELSE RAISE EXCEPTION 'event role mismatch' USING ERRCODE='42501'; END IF;
 END IF;
 RETURN NEW;
END $f$;

CREATE FUNCTION legacy_custody.reservation_complete() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $f$
DECLARE n integer;
BEGIN
 SELECT item_count INTO n FROM legacy_custody.operations WHERE operation_id=NEW.operation_id;
 IF n IS NULL OR (SELECT count(*) FROM legacy_custody.operation_items WHERE operation_id=NEW.operation_id AND ordinal BETWEEN 1 AND n)<>n
 OR (SELECT count(*) FROM legacy_custody.operation_items WHERE operation_id=NEW.operation_id)<>n
 OR NOT EXISTS(SELECT 1 FROM legacy_custody.operation_gates WHERE operation_id=NEW.operation_id) THEN
  RAISE EXCEPTION 'incomplete reservation' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $f$;

CREATE FUNCTION legacy_custody.public_guard() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $f$
DECLARE d record; aid bigint; op uuid; old_marked boolean:=false; new_marked boolean:=false;
BEGIN
 IF TG_TABLE_NAME='documents' THEN
  IF TG_OP<>'INSERT' THEN old_marked:=OLD.custody_mode='REGISTRY_V1' OR OLD.custody_operation_id IS NOT NULL; END IF;
  IF TG_OP<>'DELETE' THEN new_marked:=NEW.custody_mode='REGISTRY_V1' OR NEW.custody_operation_id IS NOT NULL OR NEW.custody_ordinal IS NOT NULL OR NEW.storage_disk='legacy_registry_v1'; END IF;
  IF TG_OP='UPDATE' AND current_user='n03_command' THEN RAISE EXCEPTION 'document lock only' USING ERRCODE='23514'; END IF;
  IF old_marked OR new_marked OR current_user='n03_command' THEN
   IF TG_OP<>'INSERT' OR current_user<>'n03_command' OR NOT new_marked THEN RAISE EXCEPTION 'registry document immutable' USING ERRCODE='23514'; END IF;
   PERFORM legacy_custody.lock_pending(NEW.custody_operation_id,1,'OPEN');
   IF NOT EXISTS(SELECT 1 FROM legacy_custody.command_results WHERE operation_id=NEW.custody_operation_id) THEN RAISE EXCEPTION 'result required' USING ERRCODE='23514'; END IF;
  END IF;
 ELSIF TG_TABLE_NAME='audit_logs' THEN
  IF TG_OP<>'INSERT' THEN old_marked:=OLD.custody_operation_id IS NOT NULL; END IF;
  IF TG_OP<>'DELETE' THEN new_marked:=NEW.custody_operation_id IS NOT NULL; END IF;
  IF old_marked OR new_marked OR current_user='n03_command' THEN
   IF TG_OP<>'INSERT' OR current_user<>'n03_command' OR NOT new_marked THEN RAISE EXCEPTION 'marked audit immutable' USING ERRCODE='23514'; END IF;
   PERFORM legacy_custody.lock_pending(NEW.custody_operation_id,1,'OPEN');
  END IF;
 ELSE
  -- This trigger sorts before the inherited kirion_plan_generic_link_guard.
  -- For a command insert acquire the operation gate BEFORE the document lock.
  IF current_user='n03_command' THEN
   IF TG_OP<>'INSERT' THEN RAISE EXCEPTION 'link immutable' USING ERRCODE='23514'; END IF;
   SELECT custody_operation_id INTO op FROM public.documents WHERE id=NEW.document_id AND custody_mode='REGISTRY_V1';
   IF op IS NULL THEN RAISE EXCEPTION 'registry link required' USING ERRCODE='23514'; END IF;
   PERFORM legacy_custody.lock_pending(op,1,'OPEN');
  END IF;
  FOR aid IN SELECT DISTINCT id FROM (SELECT CASE WHEN TG_OP<>'INSERT' THEN OLD.document_id END AS id
   UNION ALL SELECT CASE WHEN TG_OP<>'DELETE' THEN NEW.document_id END) ids WHERE id IS NOT NULL ORDER BY id LOOP
   SELECT id,custody_mode,custody_operation_id INTO d FROM public.documents WHERE id=aid FOR UPDATE;
   IF FOUND AND d.custody_mode='REGISTRY_V1' THEN
    IF current_user<>'n03_command' OR TG_OP<>'INSERT' OR d.custody_operation_id IS DISTINCT FROM op THEN
     RAISE EXCEPTION 'registry link immutable' USING ERRCODE='23514'; END IF;
    IF NOT EXISTS(SELECT 1 FROM legacy_custody.expected_links(op) x WHERE x.linkable_type=NEW.linkable_type AND x.source_id=NEW.linkable_id AND x.relationship=NEW.relationship)
    OR NEW.created_by_user_id IS DISTINCT FROM (SELECT actor_user_id FROM legacy_custody.operations WHERE operation_id=op) THEN
     RAISE EXCEPTION 'link tuple mismatch' USING ERRCODE='23514'; END IF;
   ELSIF current_user='n03_command' THEN RAISE EXCEPTION 'registry link required' USING ERRCODE='23514';
   END IF;
  END LOOP;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 RETURN NEW;
END $f$;

CREATE FUNCTION legacy_custody.command_complete() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $f$
DECLARE op uuid; o legacy_custody.operations%ROWTYPE; b record; expected_count integer;
BEGIN
 IF TG_TABLE_NAME='ownership_links' THEN SELECT operation_id INTO op FROM legacy_custody.bindings WHERE document_id=NEW.binding_document_id;
 ELSIF TG_TABLE_NAME='document_links' THEN SELECT custody_operation_id INTO op FROM public.documents WHERE id=NEW.document_id;
 ELSIF TG_TABLE_NAME IN ('documents','audit_logs') THEN op:=NEW.custody_operation_id;
 ELSE op:=NEW.operation_id;
 END IF;
 IF op IS NULL THEN RETURN NULL; END IF;
 SELECT * INTO o FROM legacy_custody.operations WHERE operation_id=op;
 IF row_security_active('public.documents'::regclass) OR row_security_active('public.document_links'::regclass) OR row_security_active('public.audit_logs'::regclass)
 OR NOT EXISTS(SELECT 1 FROM legacy_custody.terminal_receipts WHERE operation_id=op AND outcome='COMMITTED' AND fence_no=1)
 OR NOT EXISTS(SELECT 1 FROM legacy_custody.operation_gates WHERE operation_id=op AND state='OPEN' AND fence_no=1)
 OR NOT EXISTS(SELECT 1 FROM legacy_custody.command_results WHERE operation_id=op)
 OR (SELECT count(*) FROM legacy_custody.generations WHERE operation_id=op)<>o.item_count
 OR (SELECT count(*) FROM legacy_custody.bindings WHERE operation_id=op)<>o.item_count
 OR (SELECT count(*) FROM public.documents WHERE custody_operation_id=op)<>o.item_count
 OR (SELECT count(*) FROM public.audit_logs WHERE custody_operation_id=op)<>o.item_count THEN
  RAISE EXCEPTION 'incomplete command receipt' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO expected_count FROM legacy_custody.expected_links(op);
 FOR b IN SELECT x.document_id,x.upload_audit_id,x.ordinal,x.generation_id,d.document_type,d.owner_department_id,d.uploaded_by_user_id,
 d.size_bytes,d.checksum_sha256,d.mime_type,g.size_bytes AS staged_size,g.sha256 AS staged_sha,g.mime_type AS staged_mime,
 a.actor_user_id,a.actor_department_id,a.correlation_id
 FROM legacy_custody.bindings x JOIN public.documents d ON d.id=x.document_id
 JOIN legacy_custody.generations g ON g.generation_id=x.generation_id
 JOIN public.audit_logs a ON a.id=x.upload_audit_id WHERE x.operation_id=op LOOP
  IF b.owner_department_id IS DISTINCT FROM o.office_id OR b.uploaded_by_user_id IS DISTINCT FROM o.actor_user_id
  OR b.actor_user_id IS DISTINCT FROM o.actor_user_id OR b.actor_department_id IS DISTINCT FROM o.office_id OR b.correlation_id IS DISTINCT FROM o.correlation_id
  OR b.size_bytes IS DISTINCT FROM b.staged_size OR b.checksum_sha256::text IS DISTINCT FROM b.staged_sha OR b.mime_type IS DISTINCT FROM b.staged_mime
  OR b.document_type IS DISTINCT FROM (CASE WHEN expected_count=2 THEN 'supporting_document' ELSE (SELECT relationship FROM legacy_custody.expected_links(op)) END)
  OR EXISTS(SELECT 1 FROM public.plan_document_origin_receipts WHERE document_id=b.document_id)
  OR EXISTS(SELECT 1 FROM public.plan_document_bindings WHERE document_id=b.document_id)
  OR (SELECT count(*) FROM public.document_links WHERE document_id=b.document_id)<>expected_count
  OR (SELECT count(*) FROM legacy_custody.ownership_links WHERE binding_document_id=b.document_id)<>expected_count
  OR EXISTS(SELECT 1 FROM legacy_custody.expected_links(op) e WHERE NOT EXISTS (
    SELECT 1 FROM legacy_custody.ownership_links m WHERE m.binding_document_id=b.document_id AND m.linkable_type=e.linkable_type
    AND m.source_id=e.source_id AND m.relationship=e.relationship AND m.created_by_user_id=o.actor_user_id)) THEN
   RAISE EXCEPTION 'command artifact tuple mismatch' USING ERRCODE='23514';
  END IF;
 END LOOP;
 RETURN NULL;
END $f$;

CREATE TRIGGER n03_immutable BEFORE INSERT OR UPDATE OR DELETE ON legacy_custody.namespaces FOR EACH ROW EXECUTE FUNCTION legacy_custody.private_guard();
CREATE TRIGGER n03_immutable BEFORE INSERT OR UPDATE OR DELETE ON legacy_custody.operations FOR EACH ROW EXECUTE FUNCTION legacy_custody.private_guard();
CREATE TRIGGER n03_immutable BEFORE INSERT OR UPDATE OR DELETE ON legacy_custody.operation_items FOR EACH ROW EXECUTE FUNCTION legacy_custody.private_guard();
CREATE TRIGGER n03_immutable BEFORE INSERT OR UPDATE OR DELETE ON legacy_custody.operation_gates FOR EACH ROW EXECUTE FUNCTION legacy_custody.private_guard();
CREATE TRIGGER n03_immutable BEFORE INSERT OR UPDATE OR DELETE ON legacy_custody.generations FOR EACH ROW EXECUTE FUNCTION legacy_custody.private_guard();
CREATE TRIGGER n03_immutable BEFORE INSERT OR UPDATE OR DELETE ON legacy_custody.command_results FOR EACH ROW EXECUTE FUNCTION legacy_custody.private_guard();
CREATE TRIGGER n03_immutable BEFORE INSERT OR UPDATE OR DELETE ON legacy_custody.bindings FOR EACH ROW EXECUTE FUNCTION legacy_custody.private_guard();
CREATE TRIGGER n03_immutable BEFORE INSERT OR UPDATE OR DELETE ON legacy_custody.ownership_links FOR EACH ROW EXECUTE FUNCTION legacy_custody.private_guard();
CREATE TRIGGER n03_immutable BEFORE INSERT OR UPDATE OR DELETE ON legacy_custody.terminal_receipts FOR EACH ROW EXECUTE FUNCTION legacy_custody.private_guard();
CREATE TRIGGER n03_immutable BEFORE INSERT OR UPDATE OR DELETE ON legacy_custody.operation_events FOR EACH ROW EXECUTE FUNCTION legacy_custody.private_guard();
CREATE CONSTRAINT TRIGGER n03_reservation_complete AFTER INSERT ON legacy_custody.operations DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION legacy_custody.reservation_complete();
CREATE CONSTRAINT TRIGGER n03_reservation_complete AFTER INSERT ON legacy_custody.operation_items DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION legacy_custody.reservation_complete();
CREATE CONSTRAINT TRIGGER n03_reservation_complete AFTER INSERT ON legacy_custody.operation_gates DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION legacy_custody.reservation_complete();
CREATE CONSTRAINT TRIGGER n03_command_complete AFTER INSERT ON legacy_custody.command_results DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION legacy_custody.command_complete();
CREATE CONSTRAINT TRIGGER n03_command_complete AFTER INSERT ON legacy_custody.bindings DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION legacy_custody.command_complete();
CREATE CONSTRAINT TRIGGER n03_command_complete AFTER INSERT ON legacy_custody.ownership_links DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION legacy_custody.command_complete();
CREATE CONSTRAINT TRIGGER n03_command_complete AFTER INSERT ON legacy_custody.terminal_receipts DEFERRABLE INITIALLY DEFERRED FOR EACH ROW WHEN (NEW.outcome='COMMITTED') EXECUTE FUNCTION legacy_custody.command_complete();
CREATE TRIGGER a_n03_public_guard BEFORE INSERT OR UPDATE OR DELETE ON public.documents FOR EACH ROW EXECUTE FUNCTION legacy_custody.public_guard();
CREATE CONSTRAINT TRIGGER n03_public_complete AFTER INSERT ON public.documents DEFERRABLE INITIALLY DEFERRED FOR EACH ROW WHEN (NEW.custody_operation_id IS NOT NULL) EXECUTE FUNCTION legacy_custody.command_complete();
CREATE TRIGGER a_n03_public_guard BEFORE INSERT OR UPDATE OR DELETE ON public.document_links FOR EACH ROW EXECUTE FUNCTION legacy_custody.public_guard();
CREATE CONSTRAINT TRIGGER n03_public_link_complete AFTER INSERT ON public.document_links DEFERRABLE INITIALLY DEFERRED FOR EACH ROW WHEN (current_user='n03_command') EXECUTE FUNCTION legacy_custody.command_complete();
CREATE TRIGGER a_n03_public_guard BEFORE INSERT OR UPDATE OR DELETE ON public.audit_logs FOR EACH ROW EXECUTE FUNCTION legacy_custody.public_guard();
CREATE CONSTRAINT TRIGGER n03_public_complete AFTER INSERT ON public.audit_logs DEFERRABLE INITIALLY DEFERRED FOR EACH ROW WHEN (NEW.custody_operation_id IS NOT NULL) EXECUTE FUNCTION legacy_custody.command_complete();

REVOKE ALL ON ALL TABLES IN SCHEMA legacy_custody FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA legacy_custody FROM PUBLIC;
SQL);
    }

    public function down(): void
    {
        throw new RuntimeException('N03 is forward-only; dispose the isolated database instead.');
    }
};
