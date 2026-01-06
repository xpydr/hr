<?php

use App\Models\Schedule;
use App\Models\User;
use App\UserRole;

test('all authenticated users can view schedules', function () {
    $admin = User::factory()->create(['role' => UserRole::Admin]);
    $hr = User::factory()->create(['role' => UserRole::Hr]);
    $employee = User::factory()->create(['role' => UserRole::Employee]);

    $schedule = Schedule::factory()->create();

    $this->actingAs($admin)
        ->get(route('schedule.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('schedule/index')
            ->has('schedules', 1)
            ->where('canManage', true)
        );

    $this->actingAs($hr)
        ->get(route('schedule.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('schedule/index')
            ->has('schedules', 1)
            ->where('canManage', true)
        );

    $this->actingAs($employee)
        ->get(route('schedule.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('schedule/index')
            ->has('schedules', 1)
            ->where('canManage', false)
        );
});

test('admin can create a schedule', function () {
    $admin = User::factory()->create(['role' => UserRole::Admin]);

    $this->actingAs($admin)
        ->post(route('schedule.store'), [
            'date' => '2024-01-15',
            'start_time' => '09:00:00',
            'end_time' => '17:00:00',
            'break_duration' => 30,
            'shift_type' => 'full-day',
            'location' => 'Main Office',
            'notes' => 'Regular shift',
            'status' => 'published',
        ])
        ->assertRedirect(route('schedule.index'))
        ->assertSessionHas('success', 'Shift created successfully.');

    $this->assertDatabaseHas('schedules', [
        'date' => '2024-01-15 00:00:00',
        'start_time' => '09:00:00',
        'end_time' => '17:00:00',
        'break_duration' => 30,
        'shift_type' => 'full-day',
        'location' => 'Main Office',
        'notes' => 'Regular shift',
        'status' => 'published',
    ]);
});

test('hr can create a schedule', function () {
    $hr = User::factory()->create(['role' => UserRole::Hr]);

    $this->actingAs($hr)
        ->post(route('schedule.store'), [
            'date' => '2024-01-15',
            'start_time' => '09:00:00',
            'end_time' => '17:00:00',
            'shift_type' => 'morning',
        ])
        ->assertRedirect(route('schedule.index'))
        ->assertSessionHas('success', 'Shift created successfully.');

    $this->assertDatabaseHas('schedules', [
        'date' => '2024-01-15 00:00:00',
        'start_time' => '09:00:00',
        'end_time' => '17:00:00',
        'shift_type' => 'morning',
    ]);
});

test('employee cannot create a schedule', function () {
    $employee = User::factory()->create(['role' => UserRole::Employee]);

    $this->actingAs($employee)
        ->post(route('schedule.store'), [
            'date' => '2024-01-15',
            'start_time' => '09:00:00',
            'end_time' => '17:00:00',
            'shift_type' => 'morning',
        ])
        ->assertForbidden();
});

test('schedule creation requires valid data', function () {
    $admin = User::factory()->create(['role' => UserRole::Admin]);

    $this->actingAs($admin)
        ->post(route('schedule.store'), [])
        ->assertSessionHasErrors(['date', 'start_time', 'end_time', 'shift_type']);
});

test('admin can update a schedule', function () {
    $admin = User::factory()->create(['role' => UserRole::Admin]);
    $schedule = Schedule::factory()->create([
        'date' => '2024-01-15',
        'start_time' => '09:00:00',
        'end_time' => '17:00:00',
        'shift_type' => 'morning',
    ]);

    $this->actingAs($admin)
        ->patch(route('schedule.update', $schedule), [
            'date' => '2024-01-16',
            'start_time' => '10:00:00',
            'end_time' => '18:00:00',
            'shift_type' => 'afternoon',
            'location' => 'Updated Location',
        ])
        ->assertRedirect(route('schedule.index'))
        ->assertSessionHas('success', 'Shift updated successfully.');

    $this->assertDatabaseHas('schedules', [
        'id' => $schedule->id,
        'date' => '2024-01-16 00:00:00',
        'start_time' => '10:00:00',
        'end_time' => '18:00:00',
        'shift_type' => 'afternoon',
        'location' => 'Updated Location',
    ]);
});

test('hr can update a schedule', function () {
    $hr = User::factory()->create(['role' => UserRole::Hr]);
    $schedule = Schedule::factory()->create();

    $this->actingAs($hr)
        ->patch(route('schedule.update', $schedule), [
            'date' => $schedule->date->format('Y-m-d'),
            'start_time' => $schedule->start_time,
            'end_time' => $schedule->end_time,
            'shift_type' => 'night',
        ])
        ->assertRedirect(route('schedule.index'))
        ->assertSessionHas('success', 'Shift updated successfully.');

    $this->assertDatabaseHas('schedules', [
        'id' => $schedule->id,
        'shift_type' => 'night',
    ]);
});

test('employee cannot update a schedule', function () {
    $employee = User::factory()->create(['role' => UserRole::Employee]);
    $schedule = Schedule::factory()->create();

    $this->actingAs($employee)
        ->patch(route('schedule.update', $schedule), [
            'date' => $schedule->date->format('Y-m-d'),
            'start_time' => $schedule->start_time,
            'end_time' => $schedule->end_time,
            'shift_type' => 'night',
        ])
        ->assertForbidden();
});

test('admin can delete a schedule', function () {
    $admin = User::factory()->create(['role' => UserRole::Admin]);
    $schedule = Schedule::factory()->create();

    $this->actingAs($admin)
        ->delete(route('schedule.destroy', $schedule))
        ->assertRedirect(route('schedule.index'))
        ->assertSessionHas('success', 'Shift deleted successfully.');

    $this->assertDatabaseMissing('schedules', [
        'id' => $schedule->id,
    ]);
});

test('hr can delete a schedule', function () {
    $hr = User::factory()->create(['role' => UserRole::Hr]);
    $schedule = Schedule::factory()->create();

    $this->actingAs($hr)
        ->delete(route('schedule.destroy', $schedule))
        ->assertRedirect(route('schedule.index'))
        ->assertSessionHas('success', 'Shift deleted successfully.');

    $this->assertDatabaseMissing('schedules', [
        'id' => $schedule->id,
    ]);
});

test('employee cannot delete a schedule', function () {
    $employee = User::factory()->create(['role' => UserRole::Employee]);
    $schedule = Schedule::factory()->create();

    $this->actingAs($employee)
        ->delete(route('schedule.destroy', $schedule))
        ->assertForbidden();

    $this->assertDatabaseHas('schedules', [
        'id' => $schedule->id,
    ]);
});

test('guests cannot access schedule operations', function () {
    $schedule = Schedule::factory()->create();

    $this->get(route('schedule.index'))->assertRedirect(route('login'));
    $this->post(route('schedule.store'), [])->assertRedirect(route('login'));
    $this->patch(route('schedule.update', $schedule), [])->assertRedirect(route('login'));
    $this->delete(route('schedule.destroy', $schedule))->assertRedirect(route('login'));
});

test('schedules are ordered by date and start time', function () {
    $user = User::factory()->create();
    Schedule::factory()->create([
        'date' => '2024-01-20',
        'start_time' => '14:00:00',
    ]);
    Schedule::factory()->create([
        'date' => '2024-01-15',
        'start_time' => '10:00:00',
    ]);
    Schedule::factory()->create([
        'date' => '2024-01-15',
        'start_time' => '08:00:00',
    ]);

    $this->actingAs($user)
        ->get(route('schedule.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('schedules', 3)
            ->where('schedules.0.date', '2024-01-15')
            ->where('schedules.0.start_time', '08:00:00')
            ->where('schedules.1.date', '2024-01-15')
            ->where('schedules.1.start_time', '10:00:00')
            ->where('schedules.2.date', '2024-01-20')
            ->where('schedules.2.start_time', '14:00:00')
        );
});
