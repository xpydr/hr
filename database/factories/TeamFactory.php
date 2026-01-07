<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Team>
 */
class TeamFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->company(),
            'description' => fake()->optional()->paragraph(),
            'address' => fake()->optional()->address(),
            'phone' => fake()->optional()->phoneNumber(),
            'website' => fake()->optional()->url(),
            'picture' => null,
            'created_by' => User::factory(),
        ];
    }
}
