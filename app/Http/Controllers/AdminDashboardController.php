<?php

namespace App\Http\Controllers;

use App\Services\AccountRegistryQuery;
use App\Services\ActivationCredentialBroker;
use App\Services\SensitiveInertiaResponse;
use App\Services\SystemAdministrationAccess;
use App\Services\SystemAdministrationQuery;
use App\Services\StaffActivationService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

final class AdminDashboardController extends Controller
{
    public function __invoke(
        Request $request,
        SystemAdministrationAccess $access,
        SystemAdministrationQuery $dashboard,
        AccountRegistryQuery $registry,
        ActivationCredentialBroker $broker,
        SensitiveInertiaResponse $sensitiveResponse,
    ): Response|HttpResponse {
        $actor = $request->user();
        $access->authorize($actor);

        $roleOptions = $registry->roleOptions();
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'department_id' => ['nullable', 'integer', 'exists:departments,id'],
            'role' => ['nullable', Rule::in($roleOptions)],
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
        ]);

        $props = [
            ...$dashboard->dashboard($actor),
            'registry' => $registry->paginate($filters),
            'registryFilters' => [
                'search' => $filters['search'] ?? '',
                'department_id' => isset($filters['department_id']) ? (int) $filters['department_id'] : null,
                'role' => $filters['role'] ?? '',
                'status' => $filters['status'] ?? '',
            ],
            'departmentOptions' => $registry->departmentOptions(),
            'roleOptions' => $roleOptions,
            'invitableRoles' => StaffActivationService::INVITABLE_ROLES,
            'eligibleEmployees' => $registry->eligibleEmployees(),
            'pendingInvitations' => $registry->pendingInvitations(),
        ];

        $credential = $broker->take($request, $actor);
        if ($credential !== null) {
            Inertia::flash('activationCredential', $credential);

            return $sensitiveResponse->render($request, 'Admin/Index', $props);
        }

        return Inertia::render('Admin/Index', $props);
    }
}
