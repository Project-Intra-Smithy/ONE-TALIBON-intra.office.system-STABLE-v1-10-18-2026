-- Shared privilege policy; entrypoints validate target and prerequisites.
-- Re-pin function ownership and zero-PUBLIC execution after G2B CREATE OR REPLACE.
ALTER FUNCTION legacy_custody.public_guard() OWNER TO kirion_g1b_owner;
REVOKE ALL ON FUNCTION legacy_custody.public_guard() FROM PUBLIC,kirion_g1b_app,kirion_g1b_custody,kirion_g1b_repair,kirion_g1b_migrator,n03_stage,n03_command,n03_reconcile;

-- Fresh actor / office / employee read privileges (SELECT ONLY; zero PII/secret columns).
GRANT SELECT(id,role,is_active,account_status,session_version,suspended_at) ON public.users TO n03_command;
GRANT SELECT(id,user_id,department_id,full_name,employment_status,separation_date) ON public.employees TO n03_command;
GRANT SELECT(id,code,is_active,is_routable) ON public.departments TO n03_command;

-- Travel Order command privileges (zero DELETE/TRUNCATE).
GRANT SELECT(id,public_id,reference_number,issuance_date,purpose,destination,department_id,travel_start_date,travel_end_date,status,recorded_by_user_id,status_updated_by_user_id,created_at,updated_at) ON public.travel_orders TO n03_command;
GRANT INSERT(public_id,reference_number,issuance_date,purpose,destination,department_id,travel_start_date,travel_end_date,status,recorded_by_user_id,created_at,updated_at) ON public.travel_orders TO n03_command;
GRANT UPDATE(status,status_updated_by_user_id,updated_at) ON public.travel_orders TO n03_command;
GRANT SELECT(id,travel_order_id,employee_id) ON public.travel_order_employee TO n03_command;
GRANT INSERT(travel_order_id,employee_id,created_at,updated_at) ON public.travel_order_employee TO n03_command;
GRANT SELECT(id,travel_order_id,actor_user_id,event,from_status,to_status,remarks,occurred_at,created_at) ON public.travel_order_events TO n03_command;
GRANT INSERT(travel_order_id,actor_user_id,event,from_status,to_status,remarks,occurred_at,created_at) ON public.travel_order_events TO n03_command;

-- Transaction command privileges (zero DELETE/TRUNCATE).
GRANT SELECT(id,reference_no,transaction_type,request_category,request_type,action_required,title,description,priority,origin_department_id,current_department_id,created_by_user_id,assigned_employee_id,status,received_at,due_at,completed_at,closed_at,created_at,updated_at) ON public.transactions TO n03_command;
GRANT INSERT(reference_no,transaction_type,request_category,request_type,action_required,title,description,priority,origin_department_id,current_department_id,created_by_user_id,assigned_employee_id,status,received_at,due_at,created_at,updated_at) ON public.transactions TO n03_command;
GRANT UPDATE(reference_no,current_department_id,assigned_employee_id,status,received_at,completed_at,updated_at) ON public.transactions TO n03_command;
GRANT SELECT(id,transaction_id,actor_user_id,from_department_id,to_department_id,from_assigned_employee_id,to_assigned_employee_id,action,previous_status,new_status,remarks,created_at) ON public.transaction_events TO n03_command;
GRANT INSERT(transaction_id,actor_user_id,from_department_id,to_department_id,from_assigned_employee_id,to_assigned_employee_id,action,previous_status,new_status,remarks,created_at) ON public.transaction_events TO n03_command;

-- Correspondence command privileges (zero DELETE/TRUNCATE; integration_client_actor_id intentionally excluded from INSERT).
GRANT SELECT(id,public_id,external_reference_no,subject,summary,receiving_department_id,registered_by_user_id,registered_at,municipal_reference_no,classification,classified_at,classified_by_user_id,routed_by_user_id,routed_at,action_started_by_user_id,action_started_at,lifecycle_state,workflow_transaction_id,created_at,updated_at) ON public.correspondence_records TO n03_command;
GRANT UPDATE(receiving_department_id,municipal_reference_no,registered_by_user_id,registered_at,classification,classified_by_user_id,classified_at,workflow_transaction_id,routed_by_user_id,routed_at,action_started_by_user_id,action_started_at,lifecycle_state,updated_at) ON public.correspondence_records TO n03_command;
GRANT SELECT(id,correspondence_record_id,event,previous_lifecycle_state,new_lifecycle_state,actor_user_id,integration_client_actor_id,office_department_id,remarks,metadata,correlation_id,occurred_at,n03_municipal_actor) ON public.correspondence_events TO n03_command;
GRANT INSERT(correspondence_record_id,event,previous_lifecycle_state,new_lifecycle_state,actor_user_id,office_department_id,remarks,metadata,correlation_id,occurred_at) ON public.correspondence_events TO n03_command;
GRANT SELECT(year,last_value,created_at,updated_at) ON public.correspondence_reference_counters TO n03_command;
GRANT INSERT(year,last_value,created_at,updated_at) ON public.correspondence_reference_counters TO n03_command;
GRANT UPDATE(last_value,updated_at) ON public.correspondence_reference_counters TO n03_command;

-- Sequence USAGE ONLY for command-created rows.
GRANT USAGE ON SEQUENCE
 public.travel_orders_id_seq,
 public.travel_order_employee_id_seq,
 public.travel_order_events_id_seq,
 public.transactions_id_seq,
 public.transaction_events_id_seq,
 public.correspondence_events_id_seq
TO n03_command;

