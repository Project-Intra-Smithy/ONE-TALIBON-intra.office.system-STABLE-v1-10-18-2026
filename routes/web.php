<?php

use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AuditController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\MfaChallengeController;
use App\Http\Controllers\Auth\MfaEnrollmentController;
use App\Http\Controllers\Auth\MfaSecurityController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\CorrespondenceLifecycleController;
use App\Http\Controllers\CorrespondenceWorkspaceActionController;
use App\Http\Controllers\CorrespondenceWorkspaceController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\DocumentCenterController;
use App\Http\Controllers\EmployeeDirectoryController;
use App\Http\Controllers\EmployeeProfileController;
use App\Http\Controllers\LegislativeRecordController;
use App\Http\Controllers\LegislativeWorkspaceController;
use App\Http\Controllers\MayorOfficeController;
use App\Http\Controllers\MayorOfficeLiveController;
use App\Http\Controllers\MemorandumController;
use App\Http\Controllers\Messaging\ListMessagesController;
use App\Http\Controllers\Messaging\StoreMessageController;
use App\Http\Controllers\NotificationFeedController;
use App\Http\Controllers\OperationsMonitoringController;
use App\Http\Controllers\PlatformNotificationController;
use App\Http\Controllers\PortalSearchController;
use App\Http\Controllers\PropertyController;
use App\Http\Controllers\PropertyLifecycleController;
use App\Http\Controllers\PublicPortalController;
use App\Http\Controllers\RecordsController;
use App\Http\Controllers\ReportsController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\TransactionLiveController;
use App\Http\Controllers\Tasks\IndividualTaskController;
use App\Http\Controllers\TravelOrderController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', [PublicPortalController::class, 'home'])->name('public.home');

Route::middleware('guest')->group(function (): void {
    Route::get('/activate-account', [PublicPortalController::class, 'activation'])->name('public.activate-account');
    Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('/login', [AuthenticatedSessionController::class, 'store'])->name('login.store');
});

Route::middleware('auth')->group(function (): void {
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
});

Route::middleware(['auth', 'active', 'mfa.subject'])->group(function (): void {
    Route::get('/security/mfa/enroll', [MfaEnrollmentController::class, 'create'])->name('mfa.enroll');
    Route::post('/security/mfa/enroll', [MfaEnrollmentController::class, 'confirm'])->name('mfa.enroll.confirm');
    Route::get('/security/mfa/challenge', [MfaChallengeController::class, 'create'])->name('mfa.challenge');
    Route::post('/security/mfa/challenge', [MfaChallengeController::class, 'store'])->name('mfa.challenge.verify');
});

Route::middleware(['auth', 'active', 'mfa.subject', 'mfa.assured'])->group(function (): void {
    Route::get('/security/mfa', [MfaSecurityController::class, 'index'])->name('mfa.settings');
    Route::get('/security/mfa/recovery-codes', [MfaSecurityController::class, 'recovery'])->name('mfa.recovery.show');
    Route::post('/security/mfa/recovery-codes', [MfaSecurityController::class, 'regenerateRecoveryCodes'])->name('mfa.recovery.regenerate');
    Route::post('/security/mfa/reset', [MfaSecurityController::class, 'reset'])->name('mfa.reset');
    Route::delete('/security/mfa', [MfaSecurityController::class, 'disable'])->name('mfa.disable');
});

Route::middleware(['auth', 'active', 'mfa.assured'])->group(function (): void {
    Route::get('/admin', AdminDashboardController::class)->name('admin.index');
    Route::get('/dashboard', DashboardController::class)->name('dashboard');
    Route::get('/portal-search', PortalSearchController::class)->name('portal-search.index');
    Route::get('/documents', DocumentCenterController::class)->name('document-center.index');
    Route::get('/departments', DepartmentController::class)->name('departments.index');
    Route::get('/employees', EmployeeDirectoryController::class)->name('employees.index');
    Route::get('/employees/{employee}', EmployeeProfileController::class)->name('employees.show');
    Route::get('/calendar', CalendarController::class)->name('calendar.index');

    // W03: same-origin session-authenticated *individual* Task JSON surface.
    // This group already enforces auth, active account and MFA assurance.
    Route::prefix('tasks')->name('tasks.')->middleware('throttle:60,1')->group(function (): void {
        Route::get('/', [IndividualTaskController::class, 'index'])->name('index');
        Route::post('/', [IndividualTaskController::class, 'store'])->name('store');
        Route::get('/{task}', [IndividualTaskController::class, 'show'])->whereNumber('task')->name('show');
        Route::post('/{task}/start', [IndividualTaskController::class, 'start'])->whereNumber('task')->name('start');
        Route::post('/{task}/complete', [IndividualTaskController::class, 'complete'])->whereNumber('task')->name('complete');
    });
    Route::get('/operations', OperationsMonitoringController::class)->name('operations.index');

    Route::get('/announcements', fn () => Inertia::render('Announcements/Index'))->name('announcements.index');
    Route::get('/meetings', fn () => Inertia::render('Meetings/Index'))->name('meetings.index');
    Route::get('/messages', fn () => Inertia::render('Messages/Index'))->name('messages.index');
    Route::get('/messages/feed', ListMessagesController::class)->name('messages.feed.index');
    Route::post('/messages/feed', StoreMessageController::class)
        ->middleware('throttle:60,1')
        ->name('messages.feed.store');
    Route::get('/local-special-bodies', fn () => Inertia::render('LocalBodies/Index'))->name('local-special-bodies.index');
    Route::get('/development-plans', fn () => Inertia::render('Plans/Index'))->name('development-plans.index');
    Route::get('/ppas', fn () => Inertia::render('PPAs/Index'))->name('ppas.index');
    Route::get('/procurement', fn () => Inertia::render('MunicipalSystems/Index', ['referenceSurface' => 'procurement']))->name('procurement.reference');
    Route::get('/municipal-systems', fn () => Inertia::render('MunicipalSystems/Index'))->name('municipal-systems.index');

    Route::get('/correspondence', CorrespondenceWorkspaceController::class)->name('correspondence.index');
    Route::get('/records', RecordsController::class)->name('records.index');
    Route::get('/documents/{document}/download', [DocumentController::class, 'download'])->name('documents.download');
    Route::get('/travel-orders', [TravelOrderController::class, 'index'])->name('travel-orders.index');
    Route::get('/travel-orders/create', [TravelOrderController::class, 'create'])->name('travel-orders.create');
    Route::post('/travel-orders', [TravelOrderController::class, 'store'])->name('travel-orders.store');
    Route::get('/travel-orders/{travelOrder}', [TravelOrderController::class, 'show'])->name('travel-orders.show');
    Route::post('/travel-orders/{travelOrder}/status', [TravelOrderController::class, 'updateStatus'])->name('travel-orders.status');
    Route::get('/correspondence/{correspondence}/workspace', [CorrespondenceWorkspaceController::class, 'show'])->name('correspondence.workspace.show');
    Route::post('/correspondence/{correspondence}/workspace/register', [CorrespondenceWorkspaceActionController::class, 'register'])->name('correspondence.workspace.register');
    Route::post('/correspondence/{correspondence}/workspace/classify', [CorrespondenceWorkspaceActionController::class, 'classify'])->name('correspondence.workspace.classify');
    Route::post('/correspondence/{correspondence}/workspace/route', [CorrespondenceWorkspaceActionController::class, 'route'])->name('correspondence.workspace.route');
    Route::post('/correspondence/{correspondence}/workspace/act', [CorrespondenceWorkspaceActionController::class, 'act'])->name('correspondence.workspace.act');
    Route::get('/correspondence/{correspondence}', [CorrespondenceLifecycleController::class, 'show'])->name('correspondence.show');
    Route::post('/correspondence/{correspondence}/register', [CorrespondenceLifecycleController::class, 'register'])->name('correspondence.register');
    Route::post('/correspondence/{correspondence}/classify', [CorrespondenceLifecycleController::class, 'classify'])->name('correspondence.classify');
    Route::post('/correspondence/{correspondence}/route', [CorrespondenceLifecycleController::class, 'route'])->name('correspondence.route');
    Route::post('/correspondence/{correspondence}/act', [CorrespondenceLifecycleController::class, 'act'])->name('correspondence.act');

    Route::get('/property', [PropertyController::class, 'index'])->name('property.index');
    Route::post('/property', [PropertyController::class, 'store'])->name('property.store');
    Route::post('/property/{asset}/assign', [PropertyController::class, 'assign'])->name('property.assign');
    Route::post('/property/{asset}/return', [PropertyController::class, 'returnAsset'])->name('property.return');
    Route::get('/property/lifecycle', [PropertyLifecycleController::class, 'index'])->name('property.lifecycle.index');
    Route::post('/property/{asset}/maintenance', [PropertyLifecycleController::class, 'startMaintenance'])->name('property.maintenance.start');
    Route::post('/property/maintenance/{record}/complete', [PropertyLifecycleController::class, 'completeMaintenance'])->name('property.maintenance.complete');
    Route::post('/property/inventory', [PropertyLifecycleController::class, 'startInventory'])->name('property.inventory.start');
    Route::post('/property/inventory/{session}/assets/{asset}/scan', [PropertyLifecycleController::class, 'scanInventory'])->name('property.inventory.scan');
    Route::post('/property/inventory/{session}/close', [PropertyLifecycleController::class, 'closeInventory'])->name('property.inventory.close');
    Route::post('/property/{asset}/reconcile', [PropertyLifecycleController::class, 'reconcile'])->name('property.reconcile');
    Route::post('/property/{asset}/disposal', [PropertyLifecycleController::class, 'recommendDisposal'])->name('property.disposal.recommend');
    Route::post('/property/disposals/{disposal}/decision', [PropertyLifecycleController::class, 'decideDisposal'])->name('property.disposal.decide');

    Route::get('/reports', [ReportsController::class, 'index'])->name('reports.index');
    Route::get('/reports/export/{report}', [ReportsController::class, 'export'])->name('reports.export');

    Route::get('/notifications/feed', NotificationFeedController::class)->name('notifications.feed');
    Route::post('/notifications/{notification}/read', [PlatformNotificationController::class, 'markRead'])->name('notifications.read');
    Route::post('/notifications/{notification}/acknowledge', [PlatformNotificationController::class, 'acknowledge'])->name('notifications.acknowledge');

    Route::get('/transactions', [TransactionController::class, 'index'])->name('transactions.index');
    Route::get('/transactions/create', [TransactionController::class, 'create'])->name('transactions.create');
    Route::post('/transactions', [TransactionController::class, 'store'])->name('transactions.store');
    Route::get('/transactions/{transaction}/live', TransactionLiveController::class)->name('transactions.live');
    Route::get('/transactions/{transaction}', [TransactionController::class, 'show'])->name('transactions.show');
    Route::post('/transactions/{transaction}/transition', [TransactionController::class, 'transition'])->name('transactions.transition');

    Route::get('/mayor-office/live', MayorOfficeLiveController::class)->name('mayor-office.live');
    Route::get('/mayor-office', MayorOfficeController::class)->name('mayor-office');

    Route::get('/memoranda', [MemorandumController::class, 'index'])->name('memoranda.index');
    Route::get('/memoranda/create', [MemorandumController::class, 'create'])->name('memoranda.create');
    Route::post('/memoranda', [MemorandumController::class, 'store'])->name('memoranda.store');
    Route::get('/memoranda/{memorandum}', [MemorandumController::class, 'show'])->name('memoranda.show');
    Route::post('/memoranda/{memorandum}/acknowledge', [MemorandumController::class, 'acknowledge'])->name('memoranda.acknowledge');

    Route::get('/legislation', [LegislativeRecordController::class, 'index'])->name('legislation.index');
    Route::get('/legislation/create', [LegislativeRecordController::class, 'create'])->name('legislation.create');
    Route::post('/legislation', [LegislativeRecordController::class, 'store'])->name('legislation.store');
    Route::get('/legislation/{record}', [LegislativeRecordController::class, 'show'])->name('legislation.show');
    Route::get('/legislative-workspace', [LegislativeWorkspaceController::class, 'index'])->name('legislative.workspace');
    Route::post('/legislative-workspace/sessions', [LegislativeWorkspaceController::class, 'store'])->name('legislative.sessions.store');
    Route::post('/legislative-workspace/sessions/{session}/agenda', [LegislativeWorkspaceController::class, 'addAgenda'])->name('legislative.sessions.agenda.store');

    Route::get('/audit', AuditController::class)->name('audit');
});
