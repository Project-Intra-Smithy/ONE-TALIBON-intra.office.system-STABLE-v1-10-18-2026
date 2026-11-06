# ONE TALIBON — SIRIS 161-FILE FOCUSED READBACK MAP

**Source:** Project-Intra-Smithy/ONE-TALIBON-intra.office.system-STABLE-v1-10-18-2026@ec17cbfab2a52b55e4f3f45bd5ec199df3858d66 (GitHub recursive tree reported `truncated=false`). **Scope:** exactly 161 risk-ranked source paths below with Git blob IDs, intended review action and independent validation gate; this is a **path-based intake index**, not a claim that every file body was independently read. [Owning Hub #162](https://github.com/Project-Intra-Smithy/engineering-hub/issues/162). [Live takeover memory](../../.forge/memory/SIRIS_ACTING_TECH_LEAD_TAKEOVER_2026-11-06.md). Data extracted from GitHub on 2026-11-06. Verify SHA before use; do not extrapolate to mutable main.

**Read order:** (1) latest GitHub refs, issue and Forge authority (2) server/identity/privacy guards (3) protected custody/work domain (4) directory (5) actual React/CSS shell and authenticated journeys (6) executable tests. Each file entry assigns *what to check*; it does not confer implementation permission.

| # | Area | Exact path | Blob SHA | Why read | Required proof |
|---:|---|---|---|---|---|
| 1 | Forge authority | `.forge/AUTHORITY.md` | `aa7b41c34f17` | Historical/governing decision; read with live override | Positive + negative role/MFA/deny |
| 2 | Forge authority | `.forge/INTEGRATION.md` | `32ee527d45cd` | Historical/governing decision; read with live override | Issue↔memory source/authority crosslink |
| 3 | Forge authority | `.forge/memory/COMMON-SYSTEM-MEMORY-INDEX.md` | `b5f9a5da0aa9` | Historical/governing decision; read with live override | Issue↔memory source/authority crosslink |
| 4 | Forge authority | `.forge/memory/SOURCE-AUTHORITY-REGISTER.md` | `f38cf5b50ab5` | Historical/governing decision; read with live override | Positive + negative role/MFA/deny |
| 5 | Forge authority | `.forge/memory/WORK-PACKAGE-REGISTER.md` | `dc9c10818e66` | Historical/governing decision; read with live override | Lifecycle/event/queue + concurrency |
| 6 | Forge authority | `.forge/memory/WORK-PACKAGE-START-CLOSE-PROTOCOL.md` | `cf439ca6b08f` | Historical/governing decision; read with live override | Lifecycle/event/queue + concurrency |
| 7 | Forge authority | `.forge/memory/WORKFLOW-DISCOVERY-AUTHORITY-TRACK.md` | `5901360a8ad5` | Historical/governing decision; read with live override | Positive + negative role/MFA/deny |
| 8 | Forge authority | `.forge/RECOVERY.md` | `5b1632d534ce` | Historical/governing decision; read with live override | Issue↔memory source/authority crosslink |
| 9 | Forge authority | `.forge/SSOT_CURRENT.md` | `7063202c3fed` | Historical/governing decision; read with live override | Issue↔memory source/authority crosslink |
| 10 | Forge authority | `.forge/VALIDATION.md` | `3bf265fcc916` | Historical/governing decision; read with live override | Issue↔memory source/authority crosslink |
| 11 | Forge authority | `.forge/WORK_LEDGER.md` | `550b2692511d` | Historical/governing decision; read with live override | Lifecycle/event/queue + concurrency |
| 12 | Auth, middleware & identity | `app/Http/Middleware/DenyUnapprovedMessaging.php` | `97fdd7e9ed23` | Request guard / deny boundary | Positive + negative role/MFA/deny |
| 13 | Auth, middleware & identity | `app/Http/Middleware/DenyUnverifiedCorrespondenceMutations.php` | `bb60e0b85aca` | Request guard / deny boundary | Positive + negative role/MFA/deny |
| 14 | Auth, middleware & identity | `app/Domain/Identity/ConfirmedMfaEnrollment.php` | `8f78df42a064` | State machine / identity domain contract | Positive + negative role/MFA/deny |
| 15 | Auth, middleware & identity | `app/Http/Middleware/RequireMfaAssurance.php` | `765f7dd72036` | Request guard / deny boundary | Positive + negative role/MFA/deny |
| 16 | Auth, middleware & identity | `app/Http/Middleware/RequireMfaSubject.php` | `e0f6d2ac8d08` | Request guard / deny boundary | Positive + negative role/MFA/deny |
| 17 | Auth, middleware & identity | `app/Domain/Authorization/AuthorizationContext.php` | `2235ffbd0294` | State machine / identity domain contract | Positive + negative role/MFA/deny |
| 18 | Auth, middleware & identity | `app/Domain/Authorization/CapabilitySet.php` | `8bc9d503629d` | State machine / identity domain contract | Positive + negative role/MFA/deny |
| 19 | Auth, middleware & identity | `app/Domain/Identity/PrivilegedRolePolicy.php` | `b28b5dfa070e` | State machine / identity domain contract | Positive + negative role/MFA/deny |
| 20 | Auth, middleware & identity | `app/Domain/Identity/VerifiedMunicipalActor.php` | `4602cf48e0e5` | State machine / identity domain contract | Positive + negative role/MFA/deny |
| 21 | Auth, middleware & identity | `app/Http/Middleware/AssignIntegrationCorrelationId.php` | `a4fd284a31f7` | Request guard / deny boundary | Positive + negative role/MFA/deny |
| 22 | Auth, middleware & identity | `app/Http/Middleware/AssignRequestId.php` | `27c52c166a51` | Request guard / deny boundary | Positive + negative role/MFA/deny |
| 23 | Auth, middleware & identity | `app/Http/Middleware/AuditIntegrationRequest.php` | `93a91d146649` | Request guard / deny boundary | Positive + negative role/MFA/deny |
| 24 | Auth, middleware & identity | `app/Http/Middleware/AuthenticateIntegrationClient.php` | `0d4be9efdd64` | Request guard / deny boundary | Positive + negative role/MFA/deny |
| 25 | Auth, middleware & identity | `app/Http/Middleware/EnsureTaskJsonAccept.php` | `4d604eb1f7b7` | Request guard / deny boundary | Positive + negative role/MFA/deny |
| 26 | Auth, middleware & identity | `app/Http/Middleware/ExecuteIdempotentIntegrationRequest.php` | `fde887fd696a` | Request guard / deny boundary | Positive + negative role/MFA/deny |
| 27 | Auth, middleware & identity | `app/Http/Middleware/HandleInertiaRequests.php` | `8fb01a478901` | Request guard / deny boundary | Positive + negative role/MFA/deny |
| 28 | Auth, middleware & identity | `app/Http/Middleware/RequireActiveAccount.php` | `7ca94556e171` | Request guard / deny boundary | Positive + negative role/MFA/deny |
| 29 | Auth, middleware & identity | `app/Http/Middleware/RequireHrisAdmin.php` | `003561cd12d3` | Request guard / deny boundary | Positive + negative role/MFA/deny |
| 30 | Auth, middleware & identity | `app/Http/Middleware/RequireIntegrationScope.php` | `a5d3059bf3be` | Request guard / deny boundary | Positive + negative role/MFA/deny |
| 31 | Auth, middleware & identity | `app/Http/Middleware/ThrottleIntegrationClient.php` | `0bde87c532ed` | Request guard / deny boundary | Positive + negative role/MFA/deny |
| 32 | Auth, middleware & identity | `config/auth.php` | `b430191f36e9` | Release / routing / auth configuration | Positive + negative role/MFA/deny |
| 33 | Auth, middleware & identity | `config/identity.php` | `456914625bd6` | Release / routing / auth configuration | Positive + negative role/MFA/deny |
| 34 | Auth, middleware & identity | `config/messaging_release.php` | `9d314c7b5fe3` | Release / routing / auth configuration | Exact-SHA build/test and receipt |
| 35 | Auth, middleware & identity | `config/office_identity.php` | `e74916bd794f` | Release / routing / auth configuration | Positive + negative role/MFA/deny |
| 36 | Auth, middleware & identity | `config/plan_custody.php` | `8b12d2aa079e` | Release / routing / auth configuration | Classification, retrieval and crosslink denial |
| 37 | Document, custody & correspondence | `app/Services/PlanDocumentOriginGuard.php` | `80933915c28e` | Domain query/service, auth/data-scoping | Classification, retrieval and crosslink denial |
| 38 | Document, custody & correspondence | `app/Services/DocumentAccessService.php` | `bf4f65ebe361` | Domain query/service, auth/data-scoping | Positive + negative role/MFA/deny |
| 39 | Document, custody & correspondence | `app/Services/CorrespondenceAccessDecider.php` | `da51a31b68dc` | Domain query/service, auth/data-scoping | Positive + negative role/MFA/deny |
| 40 | Document, custody & correspondence | `app/Http/Controllers/CorrespondenceLifecycleController.php` | `2691e5f8b47d` | HTTP endpoint and user data projection | Classification, retrieval and crosslink denial |
| 41 | Document, custody & correspondence | `app/Http/Controllers/CorrespondenceWorkspaceActionController.php` | `33461ef4d3ba` | HTTP endpoint and user data projection | Classification, retrieval and crosslink denial |
| 42 | Document, custody & correspondence | `app/Http/Controllers/CorrespondenceWorkspaceController.php` | `972d8a118540` | HTTP endpoint and user data projection | Classification, retrieval and crosslink denial |
| 43 | Document, custody & correspondence | `app/Http/Controllers/DocumentCenterController.php` | `29a6818aa579` | HTTP endpoint and user data projection | Classification, retrieval and crosslink denial |
| 44 | Document, custody & correspondence | `app/Http/Controllers/DocumentController.php` | `d9bddfafd907` | HTTP endpoint and user data projection | Classification, retrieval and crosslink denial |
| 45 | Document, custody & correspondence | `app/Http/Controllers/RecordsController.php` | `493ac0738504` | HTTP endpoint and user data projection | Classification, retrieval and crosslink denial |
| 46 | Document, custody & correspondence | `app/Services/CorrespondenceDetailPresenter.php` | `e685ef3f4d44` | Domain query/service, auth/data-scoping | Classification, retrieval and crosslink denial |
| 47 | Document, custody & correspondence | `app/Services/CorrespondenceEventRecorder.php` | `c83c16b7ea27` | Domain query/service, auth/data-scoping | Classification, retrieval and crosslink denial |
| 48 | Document, custody & correspondence | `app/Services/CorrespondenceEvidenceService.php` | `4ff7da84ce52` | Domain query/service, auth/data-scoping | Classification, retrieval and crosslink denial |
| 49 | Document, custody & correspondence | `app/Services/CorrespondenceInboxQuery.php` | `e54d4e6dc287` | Domain query/service, auth/data-scoping | Classification, retrieval and crosslink denial |
| 50 | Document, custody & correspondence | `app/Services/CorrespondenceLifecycleService.php` | `310af4693697` | Domain query/service, auth/data-scoping | Classification, retrieval and crosslink denial |
| 51 | Document, custody & correspondence | `app/Services/CorrespondenceReceiveService.php` | `f5398efaa016` | Domain query/service, auth/data-scoping | Classification, retrieval and crosslink denial |
| 52 | Document, custody & correspondence | `app/Services/CorrespondenceReferenceNumberService.php` | `f7de65cfc190` | Domain query/service, auth/data-scoping | Classification, retrieval and crosslink denial |
| 53 | Document, custody & correspondence | `app/Services/CorrespondenceRoutingService.php` | `a1224da5317a` | Domain query/service, auth/data-scoping | Classification, retrieval and crosslink denial |
| 54 | Document, custody & correspondence | `app/Services/CorrespondenceTraceQuery.php` | `dba57dffb7b5` | Domain query/service, auth/data-scoping | Classification, retrieval and crosslink denial |
| 55 | Document, custody & correspondence | `app/Services/CorrespondenceWorkflowStateMapper.php` | `8d59ad366b6e` | Domain query/service, auth/data-scoping | Classification, retrieval and crosslink denial |
| 56 | Document, custody & correspondence | `app/Services/DocumentArchiveQuery.php` | `4bb57d49ad91` | Domain query/service, auth/data-scoping | Classification, retrieval and crosslink denial |
| 57 | Document, custody & correspondence | `app/Services/DocumentAttachmentService.php` | `fb8bd068f7a6` | Domain query/service, auth/data-scoping | Classification, retrieval and crosslink denial |
| 58 | Document, custody & correspondence | `app/Services/DocumentEvidenceQuery.php` | `7321d15aa32e` | Domain query/service, auth/data-scoping | Classification, retrieval and crosslink denial |
| 59 | Document, custody & correspondence | `app/Services/RecordsResultPresenter.php` | `76c9dfc010a4` | Domain query/service, auth/data-scoping | Classification, retrieval and crosslink denial |
| 60 | Document, custody & correspondence | `app/Services/RecordsSearchQuery.php` | `78000aa2c773` | Domain query/service, auth/data-scoping | Classification, retrieval and crosslink denial |
| 61 | Document, custody & correspondence | `config/documents.php` | `f22f6229417c` | Release / routing / auth configuration | Classification, retrieval and crosslink denial |
| 62 | Document, custody & correspondence | `database/migrations/2026_10_28_010000_create_plan_catalog_foundation_tables.php` | `f98e887571e3` | Database schema / custody provenance | Classification, retrieval and crosslink denial |
| 63 | Work, Task, dashboard & reports | `app/Services/DashboardWorkspaceQuery.php` | `2f0966234901` | Domain query/service, auth/data-scoping | 4 roles × responsive + keyboard |
| 64 | Work, Task, dashboard & reports | `app/Domain/Tasks/TaskCoreAccess.php` | `c357c2c02b7a` | State machine / identity domain contract | Positive + negative role/MFA/deny |
| 65 | Work, Task, dashboard & reports | `app/Domain/Tasks/TaskCoreService.php` | `4e243044dd1f` | State machine / identity domain contract | Lifecycle/event/queue + concurrency |
| 66 | Work, Task, dashboard & reports | `app/Domain/Tasks/TaskLifecycleState.php` | `49b75bc22563` | State machine / identity domain contract | Lifecycle/event/queue + concurrency |
| 67 | Work, Task, dashboard & reports | `app/Domain/Workflow/Authorization/TransactionAccessDecider.php` | `f010f55fa9c2` | State machine / identity domain contract | Positive + negative role/MFA/deny |
| 68 | Work, Task, dashboard & reports | `app/Domain/Workflow/Authorization/TransactionActorEligibility.php` | `94a47d492f3a` | State machine / identity domain contract | Positive + negative role/MFA/deny |
| 69 | Work, Task, dashboard & reports | `app/Domain/Workflow/Authorization/TransactionAuthorizationContextFactory.php` | `8aff3f55c5f8` | State machine / identity domain contract | Positive + negative role/MFA/deny |
| 70 | Work, Task, dashboard & reports | `app/Domain/Workflow/Authorization/TransactionCapabilities.php` | `d7cc5f6db720` | State machine / identity domain contract | Positive + negative role/MFA/deny |
| 71 | Work, Task, dashboard & reports | `app/Domain/Workflow/Events/WorkflowTransactionCreated.php` | `b9a999c4f4df` | State machine / identity domain contract | Lifecycle/event/queue + concurrency |
| 72 | Work, Task, dashboard & reports | `app/Domain/Workflow/Events/WorkflowTransactionTransitioned.php` | `e610cc78770c` | State machine / identity domain contract | Lifecycle/event/queue + concurrency |
| 73 | Work, Task, dashboard & reports | `app/Domain/Workflow/Listeners/AuditWorkflowTransactionMutation.php` | `4c9bd5efb479` | State machine / identity domain contract | Lifecycle/event/queue + concurrency |
| 74 | Work, Task, dashboard & reports | `app/Domain/Workflow/Listeners/NotifyWorkflowTransactionMutation.php` | `86cb5e747277` | State machine / identity domain contract | Lifecycle/event/queue + concurrency |
| 75 | Work, Task, dashboard & reports | `app/Domain/Workflow/Listeners/SyncWorkflowTransactionCalendar.php` | `001bc235ab8b` | State machine / identity domain contract | Lifecycle/event/queue + concurrency |
| 76 | Work, Task, dashboard & reports | `app/Domain/Workflow/ResolvedWorkflowTransition.php` | `60284c7ba58d` | State machine / identity domain contract | Lifecycle/event/queue + concurrency |
| 77 | Work, Task, dashboard & reports | `app/Domain/Workflow/SlaResolver.php` | `42a34dfae51d` | State machine / identity domain contract | Lifecycle/event/queue + concurrency |
| 78 | Work, Task, dashboard & reports | `app/Domain/Workflow/WorkflowDefinition.php` | `1da02670505b` | State machine / identity domain contract | Lifecycle/event/queue + concurrency |
| 79 | Work, Task, dashboard & reports | `app/Domain/Workflow/WorkflowDefinitionResolver.php` | `6c7a6f075385` | State machine / identity domain contract | Lifecycle/event/queue + concurrency |
| 80 | Work, Task, dashboard & reports | `app/Domain/Workflow/WorkflowDestinationResolver.php` | `fd8f5b44f27a` | State machine / identity domain contract | Lifecycle/event/queue + concurrency |
| 81 | Work, Task, dashboard & reports | `app/Domain/Workflow/WorkflowTransitionRule.php` | `e1c9219f39be` | State machine / identity domain contract | Lifecycle/event/queue + concurrency |
| 82 | Work, Task, dashboard & reports | `app/Http/Controllers/DashboardController.php` | `52c3011cd9df` | HTTP endpoint and user data projection | 4 roles × responsive + keyboard |
| 83 | Work, Task, dashboard & reports | `app/Http/Controllers/Tasks/IndividualTaskController.php` | `cd656ca2d49c` | HTTP endpoint and user data projection | Lifecycle/event/queue + concurrency |
| 84 | Work, Task, dashboard & reports | `app/Http/Controllers/TransactionController.php` | `ee67af7c0c90` | HTTP endpoint and user data projection | Lifecycle/event/queue + concurrency |
| 85 | Work, Task, dashboard & reports | `app/Http/Controllers/TransactionLiveController.php` | `d54c65d4a728` | HTTP endpoint and user data projection | Lifecycle/event/queue + concurrency |
| 86 | Work, Task, dashboard & reports | `app/Services/DashboardCorrespondenceQuery.php` | `02d4af657a07` | Domain query/service, auth/data-scoping | Classification, retrieval and crosslink denial |
| 87 | Work, Task, dashboard & reports | `app/Services/DashboardExecutiveQuery.php` | `493bb227d56f` | Domain query/service, auth/data-scoping | 4 roles × responsive + keyboard |
| 88 | Work, Task, dashboard & reports | `app/Services/DashboardExperienceResolver.php` | `88250a3c3934` | Domain query/service, auth/data-scoping | 4 roles × responsive + keyboard |
| 89 | Work, Task, dashboard & reports | `app/Services/DashboardOfficeQuery.php` | `2481bf7678fe` | Domain query/service, auth/data-scoping | Office/identity scope + LGU validation |
| 90 | Work, Task, dashboard & reports | `app/Services/DashboardPersonalQuery.php` | `3b8fe21f3397` | Domain query/service, auth/data-scoping | 4 roles × responsive + keyboard |
| 91 | Work, Task, dashboard & reports | `app/Services/DashboardTransactionQuery.php` | `a888bcaf7978` | Domain query/service, auth/data-scoping | 4 roles × responsive + keyboard |
| 92 | Work, Task, dashboard & reports | `app/Services/DashboardWorkPresenter.php` | `1b3f8b407f37` | Domain query/service, auth/data-scoping | 4 roles × responsive + keyboard |
| 93 | Department & employee directory | `app/Services/OfficeDirectoryCatalog.php` | `d92721fc6e29` | Domain query/service, auth/data-scoping | Office/identity scope + LGU validation |
| 94 | Department & employee directory | `database/seeders/MunicipalityStructureSeeder.php` | `74376befc746` | Source file; bound scope by exact SHA | Exact-SHA build/test and receipt |
| 95 | Department & employee directory | `app/Http/Controllers/EmployeeDirectoryController.php` | `b18a630f7b62` | HTTP endpoint and user data projection | Office/identity scope + LGU validation |
| 96 | Department & employee directory | `app/Http/Controllers/DepartmentController.php` | `fceb9be8db10` | HTTP endpoint and user data projection | Office/identity scope + LGU validation |
| 97 | Department & employee directory | `app/Http/Controllers/EmployeeAttendanceController.php` | `ab5756ab9dab` | HTTP endpoint and user data projection | Office/identity scope + LGU validation |
| 98 | Department & employee directory | `app/Http/Controllers/EmployeeDirectoryProfileController.php` | `f0868ec92b3e` | HTTP endpoint and user data projection | Office/identity scope + LGU validation |
| 99 | Department & employee directory | `app/Http/Controllers/EmployeeHealthVaultController.php` | `9edf16920b7e` | HTTP endpoint and user data projection | Office/identity scope + LGU validation |
| 100 | Department & employee directory | `app/Http/Controllers/EmployeePresenceController.php` | `2828ad725a8c` | HTTP endpoint and user data projection | Office/identity scope + LGU validation |
| 101 | Department & employee directory | `app/Http/Controllers/EmployeeProfileController.php` | `f6af31137b2a` | HTTP endpoint and user data projection | Office/identity scope + LGU validation |
| 102 | Department & employee directory | `app/Models/Department.php` | `b66ef7417b84` | Persistent identity/entity contract | Office/identity scope + LGU validation |
| 103 | Department & employee directory | `app/Models/Employee.php` | `d82dbde326bc` | Persistent identity/entity contract | Office/identity scope + LGU validation |
| 104 | Department & employee directory | `app/Models/User.php` | `9507b4cbd40b` | Persistent identity/entity contract | Exact-SHA build/test and receipt |
| 105 | Department & employee directory | `app/Services/DepartmentWorkspaceQuery.php` | `8b42f3c48d48` | Domain query/service, auth/data-scoping | Office/identity scope + LGU validation |
| 106 | Department & employee directory | `app/Services/EmployeeDevelopmentService.php` | `389ce6408d7a` | Domain query/service, auth/data-scoping | Office/identity scope + LGU validation |
| 107 | Department & employee directory | `app/Services/EmployeeHealthVaultService.php` | `6de5e923817a` | Domain query/service, auth/data-scoping | Office/identity scope + LGU validation |
| 108 | Department & employee directory | `app/Services/EmployeeLifecycleService.php` | `615cdcc1167d` | Domain query/service, auth/data-scoping | Office/identity scope + LGU validation |
| 109 | Department & employee directory | `app/Services/EmployeeOffboardingService.php` | `e5e2e36e3ac9` | Domain query/service, auth/data-scoping | Office/identity scope + LGU validation |
| 110 | Department & employee directory | `app/Services/PortalNavigationAccess.php` | `f4987b6b6f30` | Domain query/service, auth/data-scoping | Positive + negative role/MFA/deny |
| 111 | Frontend & interface | `resources/js/navigation/portalNavigation.ts` | `4129276ff714` | Client route/readiness/active state | 4 roles × responsive + keyboard |
| 112 | Frontend & interface | `resources/js/navigation/stagedRoutes.ts` | `67caa117c6db` | Client route/readiness/active state | 4 roles × responsive + keyboard |
| 113 | Frontend & interface | `resources/js/layouts/AppLayout.tsx` | `d10c23926b9c` | Responsive app shell & allowed links | Exact-SHA build/test and receipt |
| 114 | Frontend & interface | `resources/js/components/shell/PortalSidebar.tsx` | `4854bbdf480b` | Responsive app shell & allowed links | 4 roles × responsive + keyboard |
| 115 | Frontend & interface | `resources/js/components/shell/MobileNavigation.tsx` | `6c09bd482a7e` | Responsive app shell & allowed links | 4 roles × responsive + keyboard |
| 116 | Frontend & interface | `resources/js/pages/Dashboard.tsx` | `57bd05b3d029` | Authenticated user journey / visible state | 4 roles × responsive + keyboard |
| 117 | Frontend & interface | `resources/js/pages/Plans/Index.tsx` | `5ba5dfbecdff` | Authenticated user journey / visible state | Classification, retrieval and crosslink denial |
| 118 | Frontend & interface | `resources/js/pages/Documents/Index.tsx` | `cd45fe474668` | Authenticated user journey / visible state | Classification, retrieval and crosslink denial |
| 119 | Frontend & interface | `resources/js/pages/Employees/Index.tsx` | `03eb52d43065` | Authenticated user journey / visible state | Office/identity scope + LGU validation |
| 120 | Frontend & interface | `resources/js/pages/Departments/Index.tsx` | `30f153800379` | Authenticated user journey / visible state | Office/identity scope + LGU validation |
| 121 | Frontend & interface | `resources/js/pages/PPAs/Index.tsx` | `c69ce94d3bba` | Authenticated user journey / visible state | 4 roles × responsive + keyboard |
| 122 | Frontend & interface | `resources/js/pages/Correspondence/Index.tsx` | `60ea288ba14e` | Authenticated user journey / visible state | Classification, retrieval and crosslink denial |
| 123 | Frontend & interface | `resources/js/pages/Transactions/Index.tsx` | `8701d63bab8c` | Authenticated user journey / visible state | 4 roles × responsive + keyboard |
| 124 | Frontend & interface | `resources/css/aj-dashboard-workspace.css` | `77d9ec40ade0` | Responsive visual and focus behavior | 4 roles × responsive + keyboard |
| 125 | Frontend & interface | `resources/css/r8-plans.css` | `a37729e2fb00` | Responsive visual and focus behavior | Classification, retrieval and crosslink denial |
| 126 | Frontend & interface | `resources/js/pages/Auth/MfaChallenge.tsx` | `05884987725d` | Authenticated user journey / visible state | Positive + negative role/MFA/deny |
| 127 | Frontend & interface | `resources/js/pages/Auth/MfaEnrollment.tsx` | `9eca2d27444a` | Authenticated user journey / visible state | Positive + negative role/MFA/deny |
| 128 | Frontend & interface | `resources/js/pages/Auth/MfaRecoveryCodes.tsx` | `1f2215721c56` | Authenticated user journey / visible state | Positive + negative role/MFA/deny |
| 129 | Frontend & interface | `resources/js/pages/Auth/MfaSettings.tsx` | `6d5597a0ec51` | Authenticated user journey / visible state | Positive + negative role/MFA/deny |
| 130 | Frontend & interface | `resources/js/components/shell/MunicipalUtilities.tsx` | `700d17b502c6` | Responsive app shell & allowed links | 4 roles × responsive + keyboard |
| 131 | Frontend & interface | `resources/js/components/shell/NotificationContext.ts` | `f19aaf2a1097` | Responsive app shell & allowed links | 4 roles × responsive + keyboard |
| 132 | Frontend & interface | `resources/js/components/shell/PortalHeaderIdentity.tsx` | `7cdc463604fa` | Responsive app shell & allowed links | Positive + negative role/MFA/deny |
| 133 | Frontend & interface | `resources/js/components/shell/PortalHeaderSearch.tsx` | `2705b9a5c1ef` | Responsive app shell & allowed links | 4 roles × responsive + keyboard |
| 134 | Frontend & interface | `resources/js/components/shell/PortalTools.tsx` | `25355b6e546c` | Responsive app shell & allowed links | 4 roles × responsive + keyboard |
| 135 | Frontend & interface | `resources/js/components/shell/RecordsSearch.tsx` | `01582b3703e0` | Responsive app shell & allowed links | Classification, retrieval and crosslink denial |
| 136 | Frontend & interface | `resources/js/components/shell/SidebarAppearanceMenu.tsx` | `445e5d1a8eae` | Responsive app shell & allowed links | 4 roles × responsive + keyboard |
| 137 | Frontend & interface | `resources/js/components/shell/SidebarBrand.tsx` | `c6d77461118d` | Responsive app shell & allowed links | 4 roles × responsive + keyboard |
| 138 | Frontend & interface | `resources/js/components/shell/SidebarFooter.tsx` | `c930b9e73112` | Responsive app shell & allowed links | 4 roles × responsive + keyboard |
| 139 | Frontend & interface | `resources/js/components/shell/SidebarIdentity.tsx` | `85d652084a01` | Responsive app shell & allowed links | Positive + negative role/MFA/deny |
| 140 | Frontend & interface | `resources/js/components/shell/SidebarNavItem.tsx` | `a5ef263957db` | Responsive app shell & allowed links | 4 roles × responsive + keyboard |
| 141 | Frontend & interface | `resources/js/components/shell/SidebarSection.tsx` | `7184a3806817` | Responsive app shell & allowed links | 4 roles × responsive + keyboard |
| 142 | Evidence, CI & tests | `tests/Frontend/r8-b1-plans-library.test.mjs` | `6cdbca3de1db` | Regression contract; execute on pinned SHA | Classification, retrieval and crosslink denial |
| 143 | Evidence, CI & tests | `tests/Frontend/navigation-contract.test.mjs` | `681583147ec8` | Regression contract; execute on pinned SHA | 4 roles × responsive + keyboard |
| 144 | Evidence, CI & tests | `tests/Frontend/ot-r6-dashboard-contract.test.mjs` | `b13049339568` | Regression contract; execute on pinned SHA | 4 roles × responsive + keyboard |
| 145 | Evidence, CI & tests | `tests/Frontend/r8-a3-directory.test.mjs` | `01ad110ca820` | Regression contract; execute on pinned SHA | Office/identity scope + LGU validation |
| 146 | Evidence, CI & tests | `tests/Feature/OfficeDirectoryCatalogTest.php` | `ecad71abf8f2` | Regression contract; execute on pinned SHA | Office/identity scope + LGU validation |
| 147 | Evidence, CI & tests | `tests/Feature/MfaSecurityControlsTest.php` | `2524077014e8` | Regression contract; execute on pinned SHA | Positive + negative role/MFA/deny |
| 148 | Evidence, CI & tests | `tests/Feature/DocumentAccessPrecedenceTest.php` | `072bc6f24509` | Regression contract; execute on pinned SHA | Positive + negative role/MFA/deny |
| 149 | Evidence, CI & tests | `tests/Feature/WorkRequestBackendValidationTest.php` | `0a79ef0f79e3` | Regression contract; execute on pinned SHA | Lifecycle/event/queue + concurrency |
| 150 | Evidence, CI & tests | `tests/Feature/WorkRequestPresentationTest.php` | `0cbd21197aa9` | Regression contract; execute on pinned SHA | Lifecycle/event/queue + concurrency |
| 151 | Evidence, CI & tests | `tests/Feature/WorkRequests/WorkRequestRevocationTest.php` | `8aa8b1b89bef` | Regression contract; execute on pinned SHA | Lifecycle/event/queue + concurrency |
| 152 | Evidence, CI & tests | `tests/Feature/DashboardWorkspaceTest.php` | `d2dec804770b` | Regression contract; execute on pinned SHA | 4 roles × responsive + keyboard |
| 153 | Evidence, CI & tests | `tests/Feature/PlanCustodyFoundationTest.php` | `51d94cabd61a` | Regression contract; execute on pinned SHA | Classification, retrieval and crosslink denial |
| 154 | Evidence, CI & tests | `.github/workflows/a01-f01-canonical-integration.yml` | `8acb2f3257ec` | Hosted CI definition, not proof it ran | Lifecycle/event/queue + concurrency |
| 155 | Evidence, CI & tests | `.github/workflows/bh2-fast-render-hardening.yml` | `dfa4db9dbebc` | Hosted CI definition, not proof it ran | Lifecycle/event/queue + concurrency |
| 156 | Evidence, CI & tests | `.github/workflows/da1-prototype-day-audit.yml` | `75973093f8e3` | Hosted CI definition, not proof it ran | Lifecycle/event/queue + concurrency |
| 157 | Evidence, CI & tests | `.github/workflows/forge-uiux-validation.yml` | `c31949bbbe4c` | Hosted CI definition, not proof it ran | Lifecycle/event/queue + concurrency |
| 158 | Evidence, CI & tests | `.github/workflows/mp0-messaging-closure.yml` | `574c40f8c500` | Hosted CI definition, not proof it ran | Lifecycle/event/queue + concurrency |
| 159 | Evidence, CI & tests | `.github/workflows/ot-pr92-composite-build.yml` | `7155dfb406c0` | Hosted CI definition, not proof it ran | Lifecycle/event/queue + concurrency |
| 160 | Evidence, CI & tests | `.github/workflows/p0-windows-self-hosted-validation.yml` | `3a277af73dac` | Hosted CI definition, not proof it ran | Lifecycle/event/queue + concurrency |
| 161 | Evidence, CI & tests | `.github/workflows/s1-operations-validation.yml` | `fb79976d53d7` | Hosted CI definition, not proof it ran | Lifecycle/event/queue + concurrency |

## Intake checklist

For each selected file, Siris should record `base HEAD | path | observed behavior | linked rule/issue | changed? | author | active/held | positive/negative test | result | next owner`. Tests described above are **not executed** by this document. File unmentioned here is not excluded from risk review: see the separate complete 1,280-file Git tree manifest and drill down when a task crosses a boundary. Re-evaluate historical #128 P0s on the same exact source, not an Oct SHA. Do not run a new full-repository census unless drift or contracts justify it.
