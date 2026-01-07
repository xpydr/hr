<?php

use App\Models\Team;
use App\Models\TeamInvitation;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

test('admin users can create team invitations', function () {
    Mail::fake();

    $admin = User::factory()->admin()->create();
    $team = Team::factory()->create(['created_by' => $admin->id]);

    $this->actingAs($admin)
        ->post(route('team-invitations.store'), [
            'team_id' => $team->id,
            'email' => 'newuser@example.com',
            'method' => 'magic_link',
        ])
        ->assertRedirect()
        ->assertSessionHas('success', 'Invitation sent successfully.');

    $this->assertDatabaseHas('team_invitations', [
        'team_id' => $team->id,
        'email' => 'newuser@example.com',
        'created_by' => $admin->id,
    ]);
});

test('team invitation creation requires valid data', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('team-invitations.store'), [])
        ->assertSessionHasErrors(['team_id', 'email', 'method']);
});

test('team invitation generates token for magic link', function () {
    Mail::fake();

    $admin = User::factory()->admin()->create();
    $team = Team::factory()->create(['created_by' => $admin->id]);

    $this->actingAs($admin)
        ->post(route('team-invitations.store'), [
            'team_id' => $team->id,
            'email' => 'newuser@example.com',
            'method' => 'magic_link',
        ]);

    $invitation = TeamInvitation::where('email', 'newuser@example.com')->first();
    expect($invitation)->not->toBeNull();
    expect($invitation->token)->not->toBeEmpty();
    expect($invitation->otp_code)->toBeNull();
});

test('team invitation generates OTP code when requested', function () {
    Mail::fake();

    $admin = User::factory()->admin()->create();
    $team = Team::factory()->create(['created_by' => $admin->id]);

    $this->actingAs($admin)
        ->post(route('team-invitations.store'), [
            'team_id' => $team->id,
            'email' => 'newuser@example.com',
            'method' => 'otp',
        ]);

    $invitation = TeamInvitation::where('email', 'newuser@example.com')->first();
    expect($invitation)->not->toBeNull();
    expect($invitation->otp_code)->not->toBeNull();
    expect(strlen($invitation->otp_code))->toBe(6);
});

test('team invitation generates both token and OTP when method is both', function () {
    Mail::fake();

    $admin = User::factory()->admin()->create();
    $team = Team::factory()->create(['created_by' => $admin->id]);

    $this->actingAs($admin)
        ->post(route('team-invitations.store'), [
            'team_id' => $team->id,
            'email' => 'newuser@example.com',
            'method' => 'both',
        ]);

    $invitation = TeamInvitation::where('email', 'newuser@example.com')->first();
    expect($invitation)->not->toBeNull();
    expect($invitation->token)->not->toBeEmpty();
    expect($invitation->otp_code)->not->toBeNull();
    expect(strlen($invitation->otp_code))->toBe(6);
});

test('users can accept invitation via magic link', function () {
    $admin = User::factory()->admin()->create();
    $team = Team::factory()->create(['created_by' => $admin->id]);
    $invitation = TeamInvitation::factory()->create([
        'team_id' => $team->id,
        'email' => 'newuser@example.com',
        'created_by' => $admin->id,
    ]);

    $this->post(route('teams.accept-invite.post'), [
        'token' => $invitation->token,
        'email' => 'newuser@example.com',
    ])
        ->assertRedirect(route('login'));

    $user = User::where('email', 'newuser@example.com')->first();
    expect($user)->not->toBeNull();
    expect($user->teams)->toHaveCount(1);
    expect($user->teams->first()->id)->toBe($team->id);

    $invitation->refresh();
    expect($invitation->used_at)->not->toBeNull();
});

test('users can accept invitation via OTP code', function () {
    $admin = User::factory()->admin()->create();
    $team = Team::factory()->create(['created_by' => $admin->id]);
    $invitation = TeamInvitation::factory()->create([
        'team_id' => $team->id,
        'email' => 'newuser@example.com',
        'otp_code' => '123456',
        'created_by' => $admin->id,
    ]);

    $this->post(route('teams.accept-invite.post'), [
        'otp_code' => '123456',
        'email' => 'newuser@example.com',
    ])
        ->assertRedirect(route('login'));

    $user = User::where('email', 'newuser@example.com')->first();
    expect($user)->not->toBeNull();
    expect($user->teams)->toHaveCount(1);
    expect($user->teams->first()->id)->toBe($team->id);

    $invitation->refresh();
    expect($invitation->used_at)->not->toBeNull();
});

test('existing users can accept invitation and join team', function () {
    $admin = User::factory()->admin()->create();
    $user = User::factory()->create(['email' => 'existing@example.com']);
    $team = Team::factory()->create(['created_by' => $admin->id]);
    $invitation = TeamInvitation::factory()->create([
        'team_id' => $team->id,
        'email' => 'existing@example.com',
        'created_by' => $admin->id,
    ]);

    $this->actingAs($user)
        ->post(route('teams.accept-invite.post'), [
            'token' => $invitation->token,
            'email' => 'existing@example.com',
        ])
        ->assertRedirect(route('dashboard'))
        ->assertSessionHas('success', 'You have successfully joined the team.');

    $user->refresh();
    expect($user->teams)->toHaveCount(1);
    expect($user->teams->first()->id)->toBe($team->id);
});

test('cannot accept expired invitation', function () {
    $admin = User::factory()->admin()->create();
    $team = Team::factory()->create(['created_by' => $admin->id]);
    $invitation = TeamInvitation::factory()->expired()->create([
        'team_id' => $team->id,
        'email' => 'newuser@example.com',
        'created_by' => $admin->id,
    ]);

    $this->post(route('teams.accept-invite.post'), [
        'token' => $invitation->token,
        'email' => 'newuser@example.com',
    ])
        ->assertNotFound();
});

test('cannot accept already used invitation', function () {
    $admin = User::factory()->admin()->create();
    $team = Team::factory()->create(['created_by' => $admin->id]);
    $invitation = TeamInvitation::factory()->used()->create([
        'team_id' => $team->id,
        'email' => 'newuser@example.com',
        'created_by' => $admin->id,
    ]);

    $this->post(route('teams.accept-invite.post'), [
        'token' => $invitation->token,
        'email' => 'newuser@example.com',
    ])
        ->assertNotFound();
});

test('non-admin users cannot create invitations', function () {
    $user = User::factory()->create();
    $team = Team::factory()->create();

    $this->actingAs($user)
        ->post(route('team-invitations.store'), [
            'team_id' => $team->id,
            'email' => 'newuser@example.com',
            'method' => 'magic_link',
        ])
        ->assertForbidden();
});
