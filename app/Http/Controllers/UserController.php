<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMagicLinkInviteRequest;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\Team;
use App\Models\TeamInvitation;
use App\Models\User;
use App\UserStatus;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * Display the dashboard.
     */
    public function index(Request $request): Response
    {
        return Inertia::render('dashboard');
    }

    /**
     * Display a listing of the users.
     */
    public function usersIndex(Request $request): Response
    {
        $query = User::query();

        if ($request->filled('search')) {
            $query->where('name', 'like', '%'.$request->input('search').'%');
        }

        $users = $query
            ->latest()
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role->value,
                'status' => $user->status->value,
                'created_at' => $user->created_at->toDateTimeString(),
            ]);

        // Get teams for the dropdown
        $teams = Team::query()
            ->orderBy('name')
            ->get()
            ->map(fn (Team $team) => [
                'id' => $team->id,
                'name' => $team->name,
            ]);

        // Get team-filtered users if a team is selected
        $selectedTeamId = $request->input('team_id');
        $teamUsers = collect();

        if ($selectedTeamId) {
            $teamQuery = User::query()->where('team_id', $selectedTeamId);

            if ($request->filled('search')) {
                $teamQuery->where('name', 'like', '%'.$request->input('search').'%');
            }

            $teamUsers = $teamQuery
                ->latest()
                ->get()
                ->map(fn (User $user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role->value,
                    'status' => $user->status->value,
                    'created_at' => $user->created_at->toDateTimeString(),
                ]);
        }

        return Inertia::render('users/index', [
            'users' => $users,
            'teamUsers' => $teamUsers,
            'teams' => $teams,
            'search' => $request->input('search', ''),
            'selectedTeamId' => $selectedTeamId,
        ]);
    }

    /**
     * Store a newly created user in storage.
     */
    public function store(StoreUserRequest $request): RedirectResponse
    {
        User::create($request->validated());

        return redirect()->route('users.index')->with('success', 'User created successfully.');
    }

    /**
     * Update the specified user in storage.
     */
    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $data = $request->validated();

        if (empty($data['password'])) {
            unset($data['password']);
        }

        $user->update($data);

        return redirect()->route('users.index')->with('success', 'User updated successfully.');
    }

    /**
     * Remove the specified user from storage.
     */
    public function destroy(User $user): RedirectResponse
    {
        $user->delete();

        return redirect()->route('users.index')->with('success', 'User deleted successfully.');
    }

    /**
     * Send a magic link invite to join the current team.
     */
    public function sendMagicLinkInvite(StoreMagicLinkInviteRequest $request): RedirectResponse
    {
        $email = $request->validated()['email'];

        // Get the current team from session, or fall back to user's first team
        $currentTeamId = $request->session()->get('current_team_id');
        $user = $request->user();

        if (! $currentTeamId) {
            // Fall back to user's first team if no team is selected in session
            $firstTeam = $user->teams()->first();
            if (! $firstTeam) {
                return redirect()->route('users.index')->with('error', 'No team available. Please join a team first.');
            }
            $currentTeamId = $firstTeam->id;
        }

        $team = Team::findOrFail($currentTeamId);

        // Find or create user with the provided email
        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'name' => explode('@', $email)[0],
                'password' => bcrypt(str()->random(32)), // Random password, user can reset
                'status' => UserStatus::Pending,
            ]
        );

        // Update user status to pending if they already exist
        if ($user->status !== UserStatus::Pending) {
            $user->update(['status' => UserStatus::Pending]);
        }

        // Create team invitation
        $invitation = TeamInvitation::create([
            'team_id' => $team->id,
            'email' => $email,
            'token' => TeamInvitation::generateToken(),
            'otp_code' => null,
            'expires_at' => now()->addDays(7),
            'created_by' => $request->user()->id,
        ]);

        // Generate magic link
        $magicLink = URL::temporarySignedRoute(
            'teams.accept-invite',
            now()->addDays(7),
            ['token' => $invitation->token]
        );

        // Log the magic link instead of sending email
        Log::info('Magic Link Invite Generated', [
            'email' => $email,
            'team' => $team->name,
            'magic_link' => $magicLink,
            'expires_at' => $invitation->expires_at,
        ]);

        return redirect()->route('users.index')->with('success', "Magic link invite sent to {$email}. Check logs for the magic link.");
    }
}
