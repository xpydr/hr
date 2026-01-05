<?php

use App\Models\User;
use App\UserRole;
use App\UserStatus;

test('authenticated users can view the users list on dashboard', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->has('users', 2)
            ->where('users.0.id', $user->id)
            ->where('users.1.id', $otherUser->id)
        );
});

test('authenticated users can create a new user', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('users.store'), [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'Password123!',
            'role' => UserRole::Employee->value,
            'status' => UserStatus::Active->value,
        ])
        ->assertRedirect(route('dashboard'))
        ->assertSessionHas('success', 'User created successfully.');

    $this->assertDatabaseHas('users', [
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'role' => UserRole::Employee->value,
        'status' => UserStatus::Active->value,
    ]);
});

test('user creation requires valid data', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('users.store'), [])
        ->assertSessionHasErrors(['name', 'email', 'password', 'role', 'status']);
});

test('user creation requires unique email', function () {
    $existingUser = User::factory()->create(['email' => 'existing@example.com']);
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('users.store'), [
            'name' => 'John Doe',
            'email' => 'existing@example.com',
            'password' => 'Password123!',
            'role' => UserRole::Employee->value,
            'status' => UserStatus::Active->value,
        ])
        ->assertSessionHasErrors(['email']);
});

test('authenticated users can update a user', function () {
    $user = User::factory()->create();
    $targetUser = User::factory()->create([
        'name' => 'Jane Doe',
        'email' => 'jane@example.com',
        'role' => UserRole::Employee->value,
        'status' => UserStatus::Active->value,
    ]);

    $this->actingAs($user)
        ->patch(route('users.update', $targetUser), [
            'name' => 'Jane Smith',
            'email' => 'jane.smith@example.com',
            'role' => UserRole::Hr->value,
            'status' => UserStatus::Inactive->value,
        ])
        ->assertRedirect(route('dashboard'))
        ->assertSessionHas('success', 'User updated successfully.');

    $this->assertDatabaseHas('users', [
        'id' => $targetUser->id,
        'name' => 'Jane Smith',
        'email' => 'jane.smith@example.com',
        'role' => UserRole::Hr->value,
        'status' => UserStatus::Inactive->value,
    ]);
});

test('user update can skip password', function () {
    $user = User::factory()->create();
    $targetUser = User::factory()->create([
        'name' => 'Jane Doe',
        'email' => 'jane@example.com',
    ]);

    $originalPassword = $targetUser->password;

    $this->actingAs($user)
        ->patch(route('users.update', $targetUser), [
            'name' => 'Jane Smith',
            'email' => 'jane.smith@example.com',
            'role' => UserRole::Employee->value,
            'status' => UserStatus::Active->value,
        ])
        ->assertRedirect(route('dashboard'));

    $targetUser->refresh();
    $this->assertEquals($originalPassword, $targetUser->password);
});

test('user update can change password', function () {
    $user = User::factory()->create();
    $targetUser = User::factory()->create([
        'name' => 'Jane Doe',
        'email' => 'jane@example.com',
    ]);

    $originalPassword = $targetUser->password;

    $this->actingAs($user)
        ->patch(route('users.update', $targetUser), [
            'name' => 'Jane Smith',
            'email' => 'jane.smith@example.com',
            'password' => 'NewPassword123!',
            'role' => UserRole::Employee->value,
            'status' => UserStatus::Active->value,
        ])
        ->assertRedirect(route('dashboard'));

    $targetUser->refresh();
    $this->assertNotEquals($originalPassword, $targetUser->password);
});

test('user update requires valid data', function () {
    $user = User::factory()->create();
    $targetUser = User::factory()->create();

    $this->actingAs($user)
        ->patch(route('users.update', $targetUser), [])
        ->assertSessionHasErrors(['name', 'email', 'role', 'status']);
});

test('user update requires unique email when changed', function () {
    $existingUser = User::factory()->create(['email' => 'existing@example.com']);
    $user = User::factory()->create();
    $targetUser = User::factory()->create(['email' => 'target@example.com']);

    $this->actingAs($user)
        ->patch(route('users.update', $targetUser), [
            'name' => 'John Doe',
            'email' => 'existing@example.com',
            'role' => UserRole::Employee->value,
            'status' => UserStatus::Active->value,
        ])
        ->assertSessionHasErrors(['email']);
});

test('user update allows same email for same user', function () {
    $user = User::factory()->create();
    $targetUser = User::factory()->create(['email' => 'target@example.com']);

    $this->actingAs($user)
        ->patch(route('users.update', $targetUser), [
            'name' => 'John Doe',
            'email' => 'target@example.com',
            'role' => UserRole::Employee->value,
            'status' => UserStatus::Active->value,
        ])
        ->assertRedirect(route('dashboard'))
        ->assertSessionHasNoErrors();
});

test('authenticated users can delete a user', function () {
    $user = User::factory()->create();
    $targetUser = User::factory()->create();

    $this->actingAs($user)
        ->delete(route('users.destroy', $targetUser))
        ->assertRedirect(route('dashboard'))
        ->assertSessionHas('success', 'User deleted successfully.');

    $this->assertDatabaseMissing('users', [
        'id' => $targetUser->id,
    ]);
});

test('guests cannot access user CRUD operations', function () {
    $targetUser = User::factory()->create();

    $this->get(route('dashboard'))->assertRedirect(route('login'));
    $this->post(route('users.store'), [])->assertRedirect(route('login'));
    $this->patch(route('users.update', $targetUser), [])->assertRedirect(route('login'));
    $this->delete(route('users.destroy', $targetUser))->assertRedirect(route('login'));
});
