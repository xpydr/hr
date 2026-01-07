<?php

namespace Database\Factories;

use App\Models\Team;
use App\Models\TeamInvitation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TeamInvitation>
 */
class TeamInvitationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'team_id' => Team::factory(),
            'email' => fake()->safeEmail(),
            'token' => TeamInvitation::generateToken(),
            'otp_code' => fake()->optional(0.5)->passthrough(TeamInvitation::generateOtp()),
            'expires_at' => now()->addDays(7),
            'used_at' => null,
            'created_by' => User::factory(),
        ];
    }

    /**
     * Indicate that the invitation has been used.
     */
    public function used(): static
    {
        return $this->state(fn (array $attributes) => [
            'used_at' => now(),
        ]);
    }

    /**
     * Indicate that the invitation is expired.
     */
    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'expires_at' => now()->subDay(),
        ]);
    }
}
