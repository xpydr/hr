<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTeamRequest;
use App\Http\Requests\UpdateTeamRequest;
use App\Models\Team;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class TeamController extends Controller
{
    /**
     * Display a listing of the teams.
     */
    public function index(Request $request): Response
    {
        $query = Team::with('creator');

        if ($request->filled('search')) {
            $query->where('name', 'like', '%'.$request->input('search').'%');
        }

        $teams = $query
            ->latest()
            ->get()
            ->map(fn (Team $team) => [
                'id' => $team->id,
                'name' => $team->name,
                'description' => $team->description,
                'address' => $team->address,
                'phone' => $team->phone,
                'website' => $team->website,
                'picture' => $team->picture_url,
                'created_by' => $team->creator?->name,
                'created_at' => $team->created_at->toDateTimeString(),
            ]);

        return Inertia::render('teams/index', [
            'teams' => $teams,
            'search' => $request->input('search', ''),
        ]);
    }

    /**
     * Show the form for creating a new team.
     */
    public function create(): Response
    {
        return Inertia::render('teams/create');
    }

    /**
     * Store a newly created team in storage.
     */
    public function store(StoreTeamRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['created_by'] = $request->user()->id;

        if ($request->hasFile('picture')) {
            $path = $request->file('picture')->store('teams', 'public');
            $data['picture'] = $path;
        }

        Team::create($data);

        return redirect()->route('teams.index')->with('success', 'Team created successfully.');
    }

    /**
     * Display the specified team.
     */
    public function show(Team $team): Response
    {
        $team->load('creator', 'members');

        return Inertia::render('teams/show', [
            'team' => [
                'id' => $team->id,
                'name' => $team->name,
                'description' => $team->description,
                'address' => $team->address,
                'phone' => $team->phone,
                'website' => $team->website,
                'picture' => $team->picture_url,
                'created_by' => $team->creator?->name,
                'members' => $team->members->map(fn ($member) => [
                    'id' => $member->id,
                    'name' => $member->name,
                    'email' => $member->email,
                    'joined_at' => $member->pivot->joined_at->toDateTimeString(),
                ]),
                'created_at' => $team->created_at->toDateTimeString(),
            ],
        ]);
    }

    /**
     * Show the form for editing the specified team.
     */
    public function edit(Team $team): Response
    {
        return Inertia::render('teams/edit', [
            'team' => [
                'id' => $team->id,
                'name' => $team->name,
                'description' => $team->description,
                'address' => $team->address,
                'phone' => $team->phone,
                'website' => $team->website,
                'picture' => $team->picture_url,
            ],
        ]);
    }

    /**
     * Update the specified team in storage.
     */
    public function update(UpdateTeamRequest $request, Team $team): RedirectResponse
    {
        $data = $request->validated();

        if ($request->hasFile('picture')) {
            // Delete old picture if exists
            if ($team->picture) {
                Storage::disk('public')->delete($team->picture);
            }

            $path = $request->file('picture')->store('teams', 'public');
            $data['picture'] = $path;
        }

        $team->update($data);

        return redirect()->route('teams.index')->with('success', 'Team updated successfully.');
    }

    /**
     * Remove the specified team from storage.
     */
    public function destroy(Team $team): RedirectResponse
    {
        // Delete picture if exists
        if ($team->picture) {
            Storage::disk('public')->delete($team->picture);
        }

        $team->delete();

        return redirect()->route('teams.index')->with('success', 'Team deleted successfully.');
    }

    /**
     * Browse teams that the user can join.
     */
    public function browse(Request $request): Response
    {
        $user = $request->user();
        $userTeamIds = $user->teams()->pluck('teams.id');

        $query = Team::with('creator')
            ->whereNotIn('id', $userTeamIds);

        if ($request->filled('search')) {
            $query->where('name', 'like', '%'.$request->input('search').'%');
        }

        $teams = $query
            ->latest()
            ->get()
            ->map(fn (Team $team) => [
                'id' => $team->id,
                'name' => $team->name,
                'description' => $team->description,
                'address' => $team->address,
                'phone' => $team->phone,
                'website' => $team->website,
                'picture' => $team->picture_url,
                'created_by' => $team->creator?->name,
                'member_count' => $team->members()->count(),
                'created_at' => $team->created_at->toDateTimeString(),
            ]);

        return Inertia::render('teams/browse', [
            'teams' => $teams,
            'search' => $request->input('search', ''),
        ]);
    }

    /**
     * Switch the current team.
     */
    public function switch(Request $request): RedirectResponse
    {
        $user = $request->user();
        $teamId = $request->input('team_id');

        // If team_id is null, clear current team
        if ($teamId === null) {
            $request->session()->forget('current_team_id');

            return redirect()->back()->with('success', 'Switched to no team.');
        }

        // Verify user belongs to the team
        $team = $user->teams()->find($teamId);

        if (! $team) {
            return redirect()->back()->with('error', 'You are not a member of this team.');
        }

        $request->session()->put('current_team_id', $teamId);

        return redirect()->back()->with('success', "Switched to {$team->name}.");
    }

    /**
     * Join a team.
     */
    public function join(Request $request, Team $team): RedirectResponse
    {
        $user = $request->user();

        // Check if user is already a member
        if ($user->teams()->where('teams.id', $team->id)->exists()) {
            return redirect()->back()->with('error', 'You are already a member of this team.');
        }

        // Add user to team
        $team->members()->attach($user->id, [
            'joined_at' => now(),
        ]);

        // Optionally switch to the newly joined team
        $request->session()->put('current_team_id', $team->id);

        return redirect()->back()->with('success', "You have successfully joined {$team->name}.");
    }
}
