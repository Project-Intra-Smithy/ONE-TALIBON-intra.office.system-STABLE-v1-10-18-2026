# Writer 03 — records custody backend integration interface

Owning issue: https://github.com/Project-Intra-Smithy/engineering-hub/issues/134
Base SHA: e39c7ecc6b4b7ae6538f545a48dff57625edc478

## Delivered code (not municipal policy)
- \`ManualCorrespondenceIntakeService::receive(User, StaffReceiptData, correlationId)\` exists without route/controller. The capability gate always denies staff receipt.
- \`CorrespondenceCustodyService\` methods: \`recordActionOutcome\`, \`registerResponse\`, \`attestIssuance\`, \`recordDispatch\`, \`recordDelivery\`, \`acceptCustody\`, \`archive\`. Each accepts authenticated User and immutable CustodyCommand and returns CorrespondenceEvent; every call is denied by CustodyCapabilityGate.
- CustodyCommand envelope: public correspondence UUID, operation UUID (idempotency), correlation UUID, expected state, expected last correspondence-event ID, list of immutable Document proofs (ID/version/sha256/classification), reference attributes. Command digest uses deterministic attribute order.
- CustodyPreflight checks state/revision, milestone order, missing references, dispatch duplication and evidence classification. This pure function never authorizes a municipal action.
- Dormant writer algorithm is transactional: row lock; reread current actor and access; per-record idempotency key lookup; prior event revision; document proof and direct record link validation; event append with attribution and immutable proof snapshots; insert unique receipt. Only dispatch sets correspondence released, and only archive sets archived, behind denied capabilities. No external transmission or document deletion is done.
- Optional additive migration creates \`correspondence_operation_receipts\`, indexed by correspondence/operation and unique per record/key and per event. It is not the same as file catalog membership, Work Request status, Records custody or archiving.
- Existing CorrespondenceLifecycleService and CorrespondenceRoutingService, access, event recorder, middleware, routes, frontend and transaction service are unchanged.

## Current hard holds / integration ordering
1. Default gate \`CustodyCapabilityGate\` **always throws**. No role, mayor designation, office head or actor name implies municipal authority. Do not replace with a general role allowlist.
2. All events are milestones only until written W03/W04/W05/W06 process-owner rules validate actor, signatory, required signed proof, disposition codebook, delivery acknowledgment, custodian transfer, retention clock and legal hold. Receipt registration under existing API does not grant a staff reception mandate.
3. A proof must be linked to the Correspondence record and its version must be independently established in Document.metadata.version, its checksum and classification equal the referenced immutable proof; absent version means denial, not fallback. Writer 02 ingestion/versioning must define this metadata contract before any positive path.
4. Source and linked-transaction classification parity, including DocumentAccessService, are Slot01 P0-A dependencies; canView alone cannot grant custody authority.
5. A linked Work Request approval or completion, review checkbox, 'File' label, catalog upload, or automatic notification never releases correspondence or transfers Records custody. No execution route is mounted. No destruction feature is provided.
6. Requested archival retrieval provenance will require a separately authorized read service that verifies classified linked record and logs access. This writer does not create open retrieval routes or claim a records retention schedule.
7. Testing: Laravel negative tests require an isolated repo runner; no PG16 acceptance is implied by source tests or pure preflight checks. Main, Codex, frontend, G1/G2, deployed UAT and preserved databases must remain untouched.

## Future integration (not done)
After policy acceptance and independent security review: replace permanent default-deny with an approved, live-authority capability implementation; validate at least one synthetic positive actor and denial across office/classification; reconcile ingestion versions, document-link types, action codes, no-outgoing disposition semantics, staff numbering, retrieval provenance; run isolated PG16 transactions, idempotency races, event/receipt constraints and original Core correspondence regression; only integrator mounts routes following G1/G2 decision.
