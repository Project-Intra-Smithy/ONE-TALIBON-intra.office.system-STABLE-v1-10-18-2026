# Messaging + notifications — source-observed consumer boundary (not independently published)
**Pin:** `7b4ebb838982f6262b9fef65d18ba57488ebf941`. Messaging backend foundation is P0 accepted; frontend repo import remains pending.

## Messaging GET/POST
`GET /messages` renders [Messages/Index](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/resources/js/pages/Messages/Index.tsx) without a server-provided channel roster. [messageWorkspace](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/resources/js/components/messages/messageWorkspace.ts) and [MessagingChannels](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/app/Messaging/MessagingChannels.php) define UI/server channels.

`GET /messages/feed?channel=General[&after=lastCursor]` returns a Laravel Resource collection with `data: [{publicId,cursor,channel,body,createdAt,sender:{name,office},isMine}]`; default most recent 50 ascending, cursor fetch >after up to 100 ordered ascending. `channel` is required and must equal exactly one of `General`, `Department Heads`, `MPDO Planning`, `Project Monitoring`, `Mayor's Office`, `Inter-Office Coordination`. `after` nullable integer >=0. Producer: [ListMessagesController](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/app/Http/Controllers/Messaging/ListMessagesController.php), [MessageResource](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/app/Http/Resources/Messaging/MessageResource.php).

`POST /messages/feed` body `{channel:string,body:string}`, `body` trimmed, required max 2000; returns **201** resource DTO. Producer [StoreMessageController](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/app/Http/Controllers/Messaging/StoreMessageController.php), validator [StoreMessageRequest](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/app/Http/Requests/Messaging/StoreMessageRequest.php). Web auth/session/MFA + POST CSRF and throttle 60/min. Do not invent private/direct-message endpoints.

**Potential boundary:** six named channels are validated by enum; listing and posting controllers do **not** demonstrate membership/office filtering, despite office labels in UI. If these channels are intended confidential to departments, **BLOCK** integration pending policy and backend negative tests. The code is not by itself proof that confidentiality was required or breached. Also key/reset [MessageComposer](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/resources/js/components/messages/MessageComposer.tsx) per channel before copying, because the component holds a single local `body` state across parent channel changes.

## Notification GET/POST
`GET /notifications/feed` via [NotificationFeedController](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/app/Http/Controllers/NotificationFeedController.php) returns [NotificationFeedQuery](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/app/Services/NotificationFeedQuery.php) projection consumed by [AppLayout](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/resources/js/layouts/AppLayout.tsx) and typed in [types.ts](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/resources/js/types.ts):
```ts
type NotificationFeed = {
  pendingMemo: {id:number;memo_number:string;title:string;issuer?:string|null;department?:string|null;requires_acknowledgement:boolean}|null;
  unreadMemoCount: number;
  unreadPlatformNotificationCount: number;
  notifications: Array<{
    id?:number; key:string; type:string; title:string; message:string; url:string;
    read_url?:string|null; acknowledgement_url?:string|null;
    created_at?:string|null; urgent:boolean; requires_acknowledgement?:boolean;
  }>;
  notificationCount: number;
};
```
`POST /notifications/{id}/read`: ownership check (`user_id` matches current user), update read timestamp, redirect. `POST /notifications/{id}/acknowledge`: same owner plus `requires_acknowledgement`, update ack+read, redirect; mismatch 403, not acknowledgable 422 ([PlatformNotificationController](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/app/Http/Controllers/PlatformNotificationController.php)). The memo `pendingMemo` acknowledgement flow is distinct from the platform-notification ID endpoint; do not flatten them.

**Poll safety:** typed JSON refresh must handle 401/403/419, error state, actor change and stale data; evidence for all cases requires separate browser execution.
