<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Notification>
 */
class NotificationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'sender_id' => User::factory(),
            'recipient_id' => User::factory(),
            'title' => fake()->sentence(),
            'message' => fake()->paragraph(),
            'type' => fake()->randomElement(['info', 'warning', 'announcement', 'success']),
            'read_at' => null,
        ];
    }

    /**
     * Indicate that the notification is unread.
     */
    public function unread(): static
    {
        return $this->state(fn (array $attributes) => [
            'read_at' => null,
        ]);
    }

    /**
     * Indicate that the notification has been read.
     */
    public function read(): static
    {
        return $this->state(fn (array $attributes) => [
            'read_at' => fake()->dateTimeBetween('-1 week', 'now'),
        ]);
    }

    /**
     * Indicate that the notification is a broadcast (recipient_id is null).
     */
    public function broadcast(): static
    {
        return $this->state(fn (array $attributes) => [
            'recipient_id' => null,
        ]);
    }
}
