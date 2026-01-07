<?php

namespace App\Policies;

use App\Models\Team;
use App\Models\User;

class TeamPolicy
{
    /**
     * Determine if the user can view any teams.
     */
    public function viewAny(User $user): bool
    {
        return $user->role?->value === 'admin';
    }

    /**
     * Determine if the user can view the team.
     */
    public function view(User $user, Team $team): bool
    {
        return $user->role?->value === 'admin' || $user->teams->contains($team);
    }

    /**
     * Determine if the user can create teams.
     */
    public function create(User $user): bool
    {
        return $user->role?->value === 'admin';
    }

    /**
     * Determine if the user can update the team.
     */
    public function update(User $user, Team $team): bool
    {
        return $user->role?->value === 'admin';
    }

    /**
     * Determine if the user can delete the team.
     */
    public function delete(User $user, Team $team): bool
    {
        return $user->role?->value === 'admin';
    }
}
