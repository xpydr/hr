<?php

use App\Models\Team;
use App\Models\User;

test('admin users can view the teams list', function () {
    $admin = User::factory()->admin()->create();
    $team = Team::factory()->create(['created_by' => $admin->id]);

    $this->actingAs($admin)
        ->get(route('teams.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('teams/index')
            ->has('teams', 1)
            ->where('teams.0.id', $team->id)
        );
});

test('non-admin users cannot view the teams list', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('teams.index'))
        ->assertForbidden();
});

test('admin users can create a new team', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('teams.store'), [
            'name' => 'Acme Corp',
            'description' => 'A great company',
            'address' => '123 Main St',
            'phone' => '555-1234',
            'website' => 'https://acme.com',
        ])
        ->assertRedirect(route('teams.index'))
        ->assertSessionHas('success', 'Team created successfully.');

    $this->assertDatabaseHas('teams', [
        'name' => 'Acme Corp',
        'description' => 'A great company',
        'address' => '123 Main St',
        'phone' => '555-1234',
        'website' => 'https://acme.com',
        'created_by' => $admin->id,
    ]);
});

test('team creation requires valid data', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('teams.store'), [])
        ->assertSessionHasErrors(['name']);
});

test('team creation requires valid website URL', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('teams.store'), [
            'name' => 'Acme Corp',
            'website' => 'not-a-valid-url',
        ])
        ->assertSessionHasErrors(['website']);
});

test('admin users can update a team', function () {
    $admin = User::factory()->admin()->create();
    $team = Team::factory()->create(['created_by' => $admin->id]);

    $this->actingAs($admin)
        ->patch(route('teams.update', $team), [
            'name' => 'Updated Corp',
            'description' => 'Updated description',
            'address' => '456 New St',
            'phone' => '555-5678',
            'website' => 'https://updated.com',
        ])
        ->assertRedirect(route('teams.index'))
        ->assertSessionHas('success', 'Team updated successfully.');

    $this->assertDatabaseHas('teams', [
        'id' => $team->id,
        'name' => 'Updated Corp',
        'description' => 'Updated description',
        'address' => '456 New St',
        'phone' => '555-5678',
        'website' => 'https://updated.com',
    ]);
});

test('team update requires valid data', function () {
    $admin = User::factory()->admin()->create();
    $team = Team::factory()->create(['created_by' => $admin->id]);

    $this->actingAs($admin)
        ->patch(route('teams.update', $team), [])
        ->assertSessionHasErrors(['name']);
});

test('admin users can delete a team', function () {
    $admin = User::factory()->admin()->create();
    $team = Team::factory()->create(['created_by' => $admin->id]);

    $this->actingAs($admin)
        ->delete(route('teams.destroy', $team))
        ->assertRedirect(route('teams.index'))
        ->assertSessionHas('success', 'Team deleted successfully.');

    $this->assertDatabaseMissing('teams', [
        'id' => $team->id,
    ]);
});

test('non-admin users cannot create teams', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('teams.store'), [
            'name' => 'Acme Corp',
        ])
        ->assertForbidden();
});

test('non-admin users cannot update teams', function () {
    $user = User::factory()->create();
    $admin = User::factory()->admin()->create();
    $team = Team::factory()->create(['created_by' => $admin->id]);

    $this->actingAs($user)
        ->patch(route('teams.update', $team), [
            'name' => 'Updated Corp',
        ])
        ->assertForbidden();
});

test('non-admin users cannot delete teams', function () {
    $user = User::factory()->create();
    $admin = User::factory()->admin()->create();
    $team = Team::factory()->create(['created_by' => $admin->id]);

    $this->actingAs($user)
        ->delete(route('teams.destroy', $team))
        ->assertForbidden();
});

test('guests cannot access team CRUD operations', function () {
    $admin = User::factory()->admin()->create();
    $team = Team::factory()->create(['created_by' => $admin->id]);

    $this->get(route('teams.index'))->assertRedirect(route('login'));
    $this->post(route('teams.store'), [])->assertRedirect(route('login'));
    $this->patch(route('teams.update', $team), [])->assertRedirect(route('login'));
    $this->delete(route('teams.destroy', $team))->assertRedirect(route('login'));
});
