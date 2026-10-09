# A01-C1 individual Task — bounded released BACKEND contract / unconsumed frontend
**Authoritative release document:** [A01-C1](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/.forge/contracts/A01-C1-INDIVIDUAL-TASK-HTTP-CONTRACT.md); [controller](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/app/Http/Controllers/Tasks/IndividualTaskController.php); [routes](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/routes/web.php). **Acceptance:** backend released 09 October 2026, [bounded CI 37898947831](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/actions/runs/37898947831) historical evidence. **Frontend:** no accepted consumer; FRONTEND-REG-001 still gates F01/F02. This is a copied technical explanation, **not an alternative contract release**.

## Transport
All `/tasks*` paths are same-origin Laravel `web` session JSON, forced JSON Accept even when client omits header. Browser sends `credentials: 'same-origin'`, `Accept: application/json`, JSON Content-Type on writes, normal session cookie, CSRF token in `X-CSRF-TOKEN` or `X-XSRF-TOKEN`. Never send `X-Inertia` nor `/api/v1` API credentials. `auth,active,mfa.assured,throttle:60,1`; MFA-pending returns **403 JSON** with `{message,code:'MFA_REQUIRED',next_url}`, invalidated/deactivated session 401 with possible `ACCOUNT_INACTIVE`; CSRF 419 JSON.

| Method | Exact path | Parameters/body | Success |
|---|---|---|---|
| GET | `/tasks` | optional `page:1..10000` (default 1), `per_page:1..50` (default 20), `state:open|in_progress|completed` | 200 `{data:Task[],meta:{page,per_page,total,last_page}}` |
| POST | `/tasks` | `{title, instructions?,due_at?}` only | 201 `{data:Task}` |
| GET | `/tasks/{numeric_id}` | no query | 200 `{data:Task}` |
| POST | `/tasks/{numeric_id}/start` | empty body/object | 200 `{data:Task}` |
| POST | `/tasks/{numeric_id}/complete` | empty body/object | 200 `{data:Task}` |

`title`: required trimmed/nonblank string 255; `instructions`: nullable string <=10000; `due_at`: nullable explicit-offset `YYYY-MM-DDTHH:MM:SS+08:00`. Unknown query/body fields including `creator`, `assignee`, `department`, `state`, `source_id`, `source_domain`, timestamps must yield 422 (`errors.request`). No `assign`, `delegate`, `reopen`, `delete`, `cancel`, `bulk`, `approve` or unofficial task creation.

## Exact Task serializer
```ts
type IndividualTask = {
  id: number;
  kind: 'individual';
  title: string;
  instructions: string | null;
  state: 'open' | 'in_progress' | 'completed';
  owning_department_id: number | null;
  due_at: string | null; completed_at: string | null;
  created_at: string | null; updated_at: string | null;
};
type TaskList = { data: IndividualTask[]; meta: {page:number; per_page:number; total:number; last_page:number} };
type TaskDetail = { data: IndividualTask };
```
The department ID is a creation snapshot, **not** a grant. Authorized actor is the current session's user with active employee+department; every Task is private to its creator. Inaccessible, legacy, official or other-owner IDs are masked as 404. Lifecycle only `open → in_progress → completed`, server-recorded state/times; invalid/replayed writes 422. W02 service handles atomic locking. Do not optimistically assume success.

## Error handling
`401` unauthenticated/deactivated; `403` missing active identity/MFA; `404` inaccessible or wrong kind; `419` expired CSRF; `422` malformed payload/lifecycle (`{message, errors}`); `429` throttling; `500/503` server. Capture `X-Request-ID` for incident correlation when present. Do not automatically replay POST after 419/timeout. Do not leak user ownership by treating masked 404 as 'forbidden to someone else'.

**Hard boundary:** Work Requests use `/transactions` and `WorkflowTransaction`, not this Task `/tasks`; source-domain reference linkage and unified My Work are **NOT** released by C1.
