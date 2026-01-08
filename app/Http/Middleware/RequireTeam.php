<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireTeam
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response|RedirectResponse
    {
        $user = $request->user();

        if ($user && $user->teams()->count() === 0) {
            // Allow access to team-related routes
            $allowedRoutes = [
                'teams.browse',
                'teams.create',
                'teams.store',
                'teams.join',
                'teams.accept-invite',
                'teams.accept-invite.post',
            ];

            $routeName = $request->route()?->getName();

            if (! in_array($routeName, $allowedRoutes, true)) {
                return redirect()->route('teams.browse')
                    ->with('info', 'You must join or create a team to access the application.');
            }
        }

        return $next($request);
    }
}
