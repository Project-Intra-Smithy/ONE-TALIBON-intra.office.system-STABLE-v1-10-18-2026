<?php

namespace App\Http\Controllers;

use App\Domain\Workflow\Authorization\TransactionActorEligibility;

use App\Models\CalendarEvent;
use App\Models\LegislativeAgendaItem;
use App\Models\LegislativeSession;
use App\Models\User;
use App\Services\TransactionVisibilityQuery;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class LegislativeWorkspaceController extends Controller
{
    public function __construct(private readonly TransactionActorEligibility $eligibility) {}

    public function index(Request $request, TransactionVisibilityQuery $workRequests): Response
    {
        $user = $this->eligibleUser($request);
        abort_unless($this->canView($user), 403);

        $sessions = LegislativeSession::query()
                ->with([
                    // Agenda Work Request links are always reauthorized, including
                    // for a now-separated administrator with a still-valid session.
                    'agendaItems.transaction' => fn ($query) => $query
                        ->whereIn('transactions.id', $workRequests->scope($user)->select('transactions.id'))
                        ->select(['id', 'reference_no', 'title', 'status']),
                    'agendaItems.legislativeRecord:id,record_number,title',
                ])
                ->orderBy('scheduled_at')
                ->limit(50)
                ->get();

        // A concealed Work Request relation must not expose even its ID
        // through the legislative agenda's serialized foreign-key field.
        foreach ($sessions as $session) {
            foreach ($session->agendaItems as $agenda) {
                if ($agenda->transaction_id !== null && $agenda->transaction === null) {
                    $agenda->setAttribute('transaction_id', null);
                }
            }
        }

        return Inertia::render('Legislation/Workspace', [
            'sessions' => $sessions,
            'legislativeWork' => $workRequests->scope($user)
                ->whereHas('currentDepartment', fn ($q) => $q->where('branch', 'legislative'))
                ->whereNotIn('status', ['approved', 'disapproved', 'closed'])
                ->with('currentDepartment:id,code,name,short_name')
                ->orderBy('due_at')
                ->limit(100)
                ->get(),
            'canManage' => $this->canManage($user),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->assertManager($request);
        $data = $request->validate([
            'session_code' => ['required', 'string', 'max:80', 'unique:legislative_sessions,session_code'],
            'session_type' => ['required', Rule::in(['regular', 'special', 'committee', 'other'])],
            'title' => ['required', 'string', 'max:255'],
            'scheduled_at' => ['required', 'date'],
            'location' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:3000'],
        ]);

        $session = LegislativeSession::query()->create([
            ...$data,
            'status' => 'scheduled',
            'created_by_user_id' => $request->user()->id,
        ]);

        CalendarEvent::query()->updateOrCreate(
            ['event_key' => 'legislative-session-'.$session->id, 'user_id' => null],
            [
                'scope' => 'municipality',
                'event_type' => 'legislative_session',
                'source_domain' => 'legislation',
                'source_type' => LegislativeSession::class,
                'source_id' => $session->id,
                'title' => $session->title,
                'description' => $session->session_code,
                'priority' => 'normal',
                'starts_at' => $session->scheduled_at,
                'all_day' => false,
                'location' => $session->location,
                'action_url' => '/legislative-workspace',
                'status' => 'scheduled',
                'created_by_user_id' => $request->user()->id,
            ],
        );

        return back()->with('success', 'Legislative session scheduled.');
    }

    public function addAgenda(Request $request, LegislativeSession $session, TransactionVisibilityQuery $workRequests): RedirectResponse
    {
        $this->assertManager($request);
        $data = $request->validate([
            'sequence_no' => [
                'required',
                'integer',
                'min:1',
                Rule::unique('legislative_agenda_items', 'sequence_no')->where(fn ($query) => $query->where('legislative_session_id', $session->id)),
            ],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:3000'],
            'transaction_id' => ['nullable', 'integer', 'exists:transactions,id'],
            'legislative_record_id' => ['nullable', 'integer', 'exists:legislative_records,id'],
        ]);

        // A globally existing Work Request is not necessarily an authorized
        // link target. Do not create a cross-domain link to a concealed item.
        if (isset($data['transaction_id'])) {
            abort_unless(
                $workRequests->scope($request->user())->whereKey($data['transaction_id'])->exists(),
                403,
            );
        }

        LegislativeAgendaItem::query()->create([
            ...$data,
            'legislative_session_id' => $session->id,
            'status' => 'pending',
        ]);

        return back()->with('success', 'Agenda item added.');
    }

    private function assertManager(Request $request): void
    {
        $user = $this->eligibleUser($request);
        abort_unless($this->canManage($user), 403);
    }

    private function eligibleUser(Request $request): User
    {
        // Always re-resolve User, Employee and Department from the database.
        // In particular, system_admin is not an employment exception.
        $current = $this->eligibility->resolve($request->user());
        abort_unless($current !== null, 403);

        return User::query()->with('employee.department')->findOrFail($current['user_id']);
    }

    private function canView(User $user): bool
    {
        return $user->isRole('system_admin') || (
            $user->isRole('legislative_staff')
            && in_array($user->employee?->department?->code, ['VICE_MAYOR', 'SB', 'SB_SECRETARY'], true)
        );
    }

    private function canManage(User $user): bool
    {
        return $user->isRole('system_admin') || (
            $user->isRole('legislative_staff')
            && in_array($user->employee?->department?->code, ['SB', 'SB_SECRETARY'], true)
        );
    }
}
