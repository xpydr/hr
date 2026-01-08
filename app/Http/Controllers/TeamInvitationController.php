<?php

namespace App\Http\Controllers;

use App\Http\Requests\AcceptTeamInvitationRequest;
use App\Http\Requests\StoreTeamInvitationRequest;
use App\Models\Team;
use App\Models\TeamInvitation;
use App\Models\User;
use App\UserStatus;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;
use Inertia\Response;

class TeamInvitationController extends Controller
{
    /**
     * Store a newly created invitation.
     */
    public function store(StoreTeamInvitationRequest $request): RedirectResponse
    {
        $team = Team::findOrFail($request->validated()['team_id']);
        $method = $request->validated()['method'];
        $email = $request->validated()['email'];

        $invitation = TeamInvitation::create([
            'team_id' => $team->id,
            'email' => $email,
            'token' => TeamInvitation::generateToken(),
            'otp_code' => in_array($method, ['otp', 'both']) ? TeamInvitation::generateOtp() : null,
            'expires_at' => now()->addDays(7),
            'created_by' => $request->user()->id,
        ]);

        // Send email with magic link and/or OTP
        $magicLink = URL::temporarySignedRoute(
            'teams.accept-invite',
            now()->addDays(7),
            ['token' => $invitation->token]
        );

        Mail::raw(
            "You have been invited to join {$team->name}.\n\n".
            ($method === 'magic_link' || $method === 'both'
                ? "Click here to accept: {$magicLink}\n\n"
                : '').
            ($method === 'otp' || $method === 'both'
                ? "Your OTP code is: {$invitation->otp_code}\n\n"
                : '').
            'This invitation expires in 7 days.',
            function ($message) use ($email, $team) {
                $message->to($email)
                    ->subject("Invitation to join {$team->name}");
            }
        );

        return redirect()->back()->with('success', 'Invitation sent successfully.');
    }

    /**
     * Show the accept invitation page.
     */
    public function show(Request $request, string $token): Response|RedirectResponse
    {
        $invitation = TeamInvitation::where('token', $token)
            ->valid()
            ->firstOrFail();

        // If user is authenticated and email matches, auto-accept and redirect
        if (Auth::check() && Auth::user()->email === $invitation->email) {
            // Auto-accept the invitation
            $user = Auth::user();

            // Update user status from pending to active if it was pending
            if ($user->status === UserStatus::Pending) {
                $user->update(['status' => UserStatus::Active]);
            }

            // Attach user to team if not already attached
            if (! $user->teams->contains($invitation->team)) {
                $invitation->team->members()->attach($user->id, [
                    'joined_at' => now(),
                ]);
            }

            // Set the team as the active team
            $request->session()->put('current_team_id', $invitation->team->id);

            // Mark invitation as used
            $invitation->update(['used_at' => now()]);

            return redirect()->route('dashboard')->with('success', 'You have successfully joined the team.');
        }

        // If authenticated but email doesn't match, show error
        $emailMismatch = Auth::check() && Auth::user()->email !== $invitation->email;

        return Inertia::render('teams/accept-invite', [
            'invitation' => [
                'token' => $invitation->token,
                'email' => $invitation->email,
                'team' => [
                    'id' => $invitation->team->id,
                    'name' => $invitation->team->name,
                ],
                'has_otp' => $invitation->otp_code !== null,
            ],
            'emailMismatch' => $emailMismatch,
        ]);
    }

    /**
     * Accept the invitation.
     */
    public function accept(AcceptTeamInvitationRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        // Find invitation
        if (isset($validated['token'])) {
            $invitation = TeamInvitation::where('token', $validated['token'])
                ->where('email', $validated['email'])
                ->valid()
                ->firstOrFail();
        } else {
            $invitation = TeamInvitation::where('otp_code', $validated['otp_code'])
                ->where('email', $validated['email'])
                ->valid()
                ->firstOrFail();
        }

        // Check authentication first
        if (! Auth::check()) {
            // If not authenticated, validate email matches invitation and redirect to login/register
            if ($validated['email'] !== $invitation->email) {
                return redirect()->back()->withErrors(['email' => 'The email must match the invitation email.']);
            }

            // Store invitation token in session for redirect after login/register
            $request->session()->put('invitation_token', $invitation->token);

            return redirect()->route('login', ['invitation_token' => $invitation->token])
                ->with('info', 'Please sign in or create an account to accept the invitation.');
        }

        // User is authenticated - verify email matches
        $user = Auth::user();
        if ($user->email !== $invitation->email) {
            return redirect()->route('dashboard')
                ->with('error', 'This invitation was for a different email address. Please sign out and sign in with the correct email.');
        }

        // Email matches - process invitation
        // Update user status from pending to active if it was pending
        if ($user->status === UserStatus::Pending) {
            $user->update(['status' => UserStatus::Active]);
        }

        // Attach user to team if not already attached
        if (! $user->teams->contains($invitation->team)) {
            $invitation->team->members()->attach($user->id, [
                'joined_at' => now(),
            ]);
        }

        // Set the team as the active team
        $request->session()->put('current_team_id', $invitation->team->id);

        // Mark invitation as used
        $invitation->update(['used_at' => now()]);

        return redirect()->route('dashboard')->with('success', 'You have successfully joined the team.');
    }
}
