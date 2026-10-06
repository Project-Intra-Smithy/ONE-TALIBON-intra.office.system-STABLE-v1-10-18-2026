# KIRION FORGE: CODE WRITER — A01-W01 TASK DOMAIN FOUNDATION

## Authority

Program:

`COMMON SYSTEM / P1 — COMMON WORK & ACCOUNTABILITY`

Series:

`A01 — FIRST-CLASS TASK DOMAIN`

Work package:

`A01-W01 — TASK DOMAIN FOUNDATION`

Technical Authority:

**Kirch Ivan Balite**

Backend repository:

`Kirch-Nairu/Talibon-Sales-Prototype`

Canonical source that opened A01:

`main@f2ff373113f89173016634505eb3c3943edfb35c`

A01 coordination branch:

`KIRCH-TALIBON-P1-A01-FIRST-CLASS-TASK`

Writer source SHA will be the exact coordination HEAD containing this handoff.

No writer may start from an older P0-H SHA.

---

# Mission

Create the minimal canonical persistence/model foundation for ONE TALIBON's generic common `Task` domain.

This package intentionally stops before lifecycle policy, application services, routes, events, My Work integration and frontend.

The result should give W02 a clean, additive, test-backed domain foundation.

---

# Governing invariants

`Task != Work Request`

`Work Request != Correspondence`

`Document != Transaction`

A Task may reference another source domain but must not own or mutate that domain's lifecycle.

Do not change `WorkflowTransaction`.

Do not change current My Work behavior.

Do not introduce department-specific workflow rules.

---

# Owned files

Authorized new/owned files:

- `app/Models/Task.php`
- one new additive migration under `database/migrations/**_create_tasks_table.php`
- `tests/Feature/Tasks/TaskDomainFoundationTest.php`

If a directly related factory is genuinely required for the test only:

- `database/factories/TaskFactory.php`

is conditionally allowed.

No other file is writer-owned.

Any need to edit another file is a STOP CONDITION and returns to Maintainer.

---

# Required persistence contract

Create a new `tasks` table following existing Laravel/PostgreSQL conventions.

Required fields:

- `id` — normal application primary key convention;
- `title` — required short human-readable Task title;
- `instructions` — nullable text;
- `state` — required bounded string storage; W01 stores state but does not define/authorize the lifecycle;
- `created_by_user_id` — required creator relation to `users`, preserve historical integrity using existing restrict-style convention;
- `assigned_to_user_id` — nullable assignee relation to `users`, null-on-delete consistent with existing assignment patterns;
- `source_domain` — nullable bounded source-domain identifier;
- `source_type` — nullable bounded source type;
- `source_id` — nullable unsigned source identifier consistent with existing notification/calendar source references;
- `due_at` — nullable timezone-aware timestamp;
- `completed_at` — nullable timezone-aware timestamp;
- timezone-aware created/updated timestamps.

Required indexes:

- `state`;
- `due_at`;
- `completed_at`;
- compound/index support appropriate for `assigned_to_user_id + state`;
- source lookup support appropriate for `source_domain + source_id`.

Do not add department/office, priority, approval, SLA, reviewer, signatory or routing fields merely because they might be useful later.

W02 or later may add fields only when accepted lifecycle/authorization evidence justifies them.

---

# Required Task model contract

Create `App\Models\Task`.

Required:

- `HasFactory` if consistent with current test approach;
- fillable attributes only for W01-owned fields;
- datetime casts for `due_at` and `completed_at`;
- `creator(): BelongsTo` using `created_by_user_id`;
- `assignee(): BelongsTo` using `assigned_to_user_id`.

Do NOT add:

- lifecycle transition methods;
- policy checks;
- notification side effects;
- calendar side effects;
- source polymorphic ownership;
- WorkflowTransaction conversion helpers;
- UI/resource serialization.

Those belong later.

---

# Required tests

Create focused Feature coverage proving at minimum:

1. the migration creates the expected Task persistence;
2. a standalone Task can be persisted with no source reference;
3. a Task can carry a source reference without requiring/mutating the source record;
4. creator relation resolves correctly;
5. assignee may be null;
6. assignee relation resolves when present;
7. due/completed timestamps are cast as datetimes;
8. the new Task table does not require a Work Request/WorkflowTransaction to exist.

Where practical, prove migration rollback/recreate behavior using the existing disposable test approach.

Do not write W02 lifecycle/authorization tests in W01.

---

# Negative scope

Explicitly prohibited:

- editing `transactions` table/migrations;
- editing `WorkflowTransaction`;
- editing WorkQueue/My Work code;
- routes/controllers/resources;
- policies/Gates;
- Task lifecycle enum/transition service;
- events/listeners;
- notifications/calendar integration;
- dashboard/report/search integration;
- frontend;
- Full HRIS;
- Procurement;
- Project Monitoring;
- Meetings/Announcements;
- production/deployment;
- broad dependency upgrades;
- migration squashing;
- protected database mutation.

---

# Validation

Writer should run the narrowest available validation that proves this package.

Required minimum if local tooling is available:

- targeted Task Feature test;
- relevant migration/fresh-test path against disposable test DB;
- existing Work Request-focused regression test(s) only if inexpensive and already available.

Record exact commands and outcomes.

Allowed result vocabulary:

`PASS / FAIL / NOT RUN / NOT OBSERVED`

Never claim PASS for a command not executed.

---

# Stop conditions

STOP and return to Maintainer if:

- Task requires department/office context to satisfy a concrete test;
- lifecycle values/defaults cannot be introduced without choosing business semantics;
- source reference cannot be represented without changing another domain;
- existing user FK behavior conflicts with the required creator/assignee semantics;
- migration would require modifying existing transaction schema;
- test setup requires broad unrelated source edits.

Do not solve a stop condition by broadening scope.

---

# Return contract

Return exactly:

1. branch name;
2. exact candidate SHA;
3. commit list;
4. changed-file list;
5. concise schema/model summary;
6. tests/commands run with PASS/FAIL/NOT RUN;
7. any stop-condition or unresolved contract issue;
8. explicit statement that `WorkflowTransaction` / current My Work were not modified.

Do not merge.
Do not promote.
Do not edit the A01 coordination branch.
