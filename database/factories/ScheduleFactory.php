<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Schedule>
 */
class ScheduleFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startHour = fake()->numberBetween(6, 14);
        $startTime = sprintf('%02d:00:00', $startHour);
        $endHour = fake()->numberBetween($startHour + 4, 22);
        $endTime = sprintf('%02d:00:00', $endHour);

        return [
            'date' => fake()->date(),
            'start_time' => $startTime,
            'end_time' => $endTime,
            'break_duration' => fake()->numberBetween(0, 60),
            'shift_type' => fake()->randomElement(['morning', 'afternoon', 'night', 'full-day']),
            'location' => fake()->optional()->address(),
            'notes' => fake()->optional()->paragraph(),
            'status' => fake()->randomElement(['published', 'draft', 'cancelled']),
            'is_recurring' => fake()->boolean(30),
            'recurrence_pattern' => fake()->optional(0.5)->randomElement(['daily', 'weekly', 'monthly']),
        ];
    }
}
