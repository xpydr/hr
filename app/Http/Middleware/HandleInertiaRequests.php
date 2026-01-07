<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        $unreadNotificationCount = $request->user()
            ?->receivedNotifications()
            ->whereNull('read_at')
            ->count() ?? 0;

        $user = $request->user();

        $teams = [];
        $currentTeam = null;

        if ($user) {
            $teams = $user->teams()
                ->get()
                ->map(fn ($team) => [
                    'id' => $team->id,
                    'name' => $team->name,
                    'picture' => $team->picture_url,
                ])
                ->toArray();

            // Get current team from session or use first team
            $currentTeamId = $request->session()->get('current_team_id');
            if ($currentTeamId) {
                $currentTeam = collect($teams)->firstWhere('id', $currentTeamId);
            }

            // If no current team selected, use first team
            if (! $currentTeam && count($teams) > 0) {
                $currentTeam = $teams[0];
            }
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role?->value,
                ] : null,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'unreadNotificationCount' => $unreadNotificationCount,
            'teams' => $teams,
            'currentTeam' => $currentTeam,
        ];
    }
}
