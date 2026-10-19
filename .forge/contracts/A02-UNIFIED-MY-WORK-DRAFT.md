# A02 Unified My Work — preparatory contract (DRAFT / UNACCEPTED)

Mission: `MAINT-CC80-001 / A02-PREP-R1`. This note is **not** a released HTTP/feature contract or permission to integrate, merge or deploy.

## Read boundary

`App\Services\CommonWork\UnifiedMyWorkQuery::paginate(User $claimedActor, int $page = 1, int $perPage = 20)` returns a Laravel `LengthAwarePaginator` of immutable `CommonWorkItem` records. Page: `1..10000`; size: `1..50`. The session-authenticated, currently active employee in an active office must match the claimed actor, using the Task core's live actor verification. No endpoint or route is registered.

The personal Task source is the **existing** `TaskCoreService::visibleIndividualTasks` scope: `task_kind = individual`, unassigned, created by session actor. It does not extend Task rights based on office, executive role, historical Task rows or `owning_department_id` snapshots.

The Work Request source is the **existing** `TransactionVisibilityQuery::scope` over `WorkflowTransaction` / `transactions`, intersected with `(created_by_user_id = actor OR assigned_employee_id = actor.employee.id)`. This preliminary personal feed deliberately excludes office-only/unassigned queues, executive-wide oversight records and other users' responsibilities, even when those records are legitimately visible in separate Work Queue views. Existing authoritative Work Request behavior remains intact.

## Presentation-only identity and status

Each record has a source-qualified `key` (`individual_task:<id>` or `work_request:<id>`), `source`, `source_id`, `source_kind` (Task's `individual` or the transaction's native `transaction_type`), title, **native** `source_state`, source-specific `responsibility`, optional Work Request reference, due/updated timestamps and a read-only `is_terminal` hint calculated **separately** per domain. Task uses `TaskLifecycleState::Completed`; Work Request uses configured workflow terminal statuses. No common state machine, write endpoint, global WorkItem model, event merge, or inferred action authority exists.

Ordering is updated timestamp descending, then source discriminator ascending, then source-local ID descending. SQL `UNION ALL` and database pagination avoid unbounded reads and N+1 presentation loads. Count is scoped to the two authorized personal responsibility queries, **not** all municipal work.

## Open authority questions (for Kirch / process owners)

1. Should formal A02 later include office/unassigned queues, and for which personas? This DRAFT does not.
2. Is the Work Request creator also a "My Work" responsibility after the request leaves their office? This DRAFT includes it only while source `TransactionVisibilityQuery` authorizes it.
3. Is a generic "requires my action" label useful or misleading across these different lifecycles? This DRAFT intentionally omits it.
4. Which final filters, source links and event-history details belong in an authorized frontend contract? None are released here.
5. Should native per-record `TransactionPolicy::view` be made the canonical query-level enforcement mechanism if its future semantics diverge from `TransactionVisibilityQuery`? Reconcile before a public route.

## Acceptance gate

Independent Nox review must challenge cross-owner, cross-department, executive-role and inactive-identity negatives; SQL scope/union/pagination; no lifecycle or event cross-contamination; and existing Work Request regressions. Actual PostgreSQL feature tests and an exact-head validation record remain required. A01 F01/F02/I01/CI01/QA01/TL01/H and Kirch acceptance remain independent holds. **No merge, no release, no production mutation.**
