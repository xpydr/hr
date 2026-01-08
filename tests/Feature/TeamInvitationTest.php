<?php

use App\Models\Team;
use App\Models\TeamInvitation;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

test('admin users can create team invitations', function () {
    Mail::fake();

    $admin = User::factory()->admin()->create();
    $team = Team::factory()->create(['created_by' => $admin->id]);
    $team->members()->attach($admin->id, ['joined_at' => now()]);

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
    $team->members()->attach($admin->id, ['joined_at' => now()]);

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
    $team->members()->attach($admin->id, ['joined_at' => now()]);

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
    $team->members()->attach($admin->id, ['joined_at' => now()]);

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

test('unauthenticated users are redirected to login when accepting invitation via magic link', function () {
    $admin = User::factory()->admin()->create();
    $team = Team::factory()->create(['created_by' => $admin->id]);
    $invitation = TeamInvitation::factory()->create([
        'team_id' => $team->id,
        'email' => 'newuser@example.com',
        'created_by' => $admin->id,
    ]);

    $response = $this->post(route('teams.accept-invite.post'), [
        'token' => $invitation->token,
        'email' => 'newuser@example.com',
    ]);

    $response->assertRedirect(route('login', ['invitation_token' => $invitation->token]));
    $response->assertSessionHas('info', 'Please sign in or create an account to accept the invitation.');

    // User should not be created yet
    $user = User::where('email', 'newuser@example.com')->first();
    expect($user)->toBeNull();

    // Invitation should not be marked as used
    $invitation->refresh();
    expect($invitation->used_at)->toBeNull();
});

test('unauthenticated users are redirected to login when accepting invitation via OTP code', function () {
    $admin = User::factory()->admin()->create();
    $team = Team::factory()->create(['created_by' => $admin->id]);
    $invitation = TeamInvitation::factory()->create([
        'team_id' => $team->id,
        'email' => 'newuser@example.com',
        'otp_code' => '123456',
        'created_by' => $admin->id,
    ]);

    $response = $this->post(route('teams.accept-invite.post'), [
        'otp_code' => '123456',
        'email' => 'newuser@example.com',
    ]);

    $response->assertRedirect(route('login', ['invitation_token' => $invitation->token]));
    $response->assertSessionHas('info', 'Please sign in or create an account to accept the invitation.');

    // User should not be created yet
    $user = User::where('email', 'newuser@example.com')->first();
    expect($user)->toBeNull();

    // Invitation should not be marked as used
    $invitation->refresh();
    expect($invitation->used_at)->toBeNull();
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

    $response = $this->actingAs($user)
        ->post(route('teams.accept-invite.post'), [
            'token' => $invitation->token,
            'email' => 'existing@example.com',
        ])
        ->assertRedirect(route('dashboard'))
        ->assertSessionHas('success', 'You have successfully joined the team.');

    $user->refresh();
    expect($user->teams)->toHaveCount(1);
    expect($user->teams->first()->id)->toBe($team->id);

    // Verify the team is set as the active team
    expect($response->getSession()->get('current_team_id'))->toBe($team->id);
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
    $team->members()->attach($user->id, ['joined_at' => now()]);

    $this->actingAs($user)
        ->post(route('team-invitations.store'), [
            'team_id' => $team->id,
            'email' => 'newuser@example.com',
            'method' => 'magic_link',
        ])
        ->assertForbidden();
});

test('authenticated user with matching email auto-accepts invitation when visiting link', function () {
    $admin = User::factory()->admin()->create();
    $user = User::factory()->create(['email' => 'invited@example.com']);
    $team = Team::factory()->create(['created_by' => $admin->id]);
    $invitation = TeamInvitation::factory()->create([
        'team_id' => $team->id,
        'email' => 'invited@example.com',
        'created_by' => $admin->id,
    ]);

    $response = $this->actingAs($user)
        ->get(route('teams.accept-invite', ['token' => $invitation->token]))
        ->assertRedirect(route('dashboard'))
        ->assertSessionHas('success', 'You have successfully joined the team.');

    $user->refresh();
    expect($user->teams)->toHaveCount(1);
    expect($user->teams->first()->id)->toBe($team->id);

    // Verify the team is set as the active team
    expect($response->getSession()->get('current_team_id'))->toBe($team->id);

    $invitation->refresh();
    expect($invitation->used_at)->not->toBeNull();
});

test('authenticated user with different email sees error message on invitation page', function () {
    $admin = User::factory()->admin()->create();
    $user = User::factory()->create(['email' => 'different@example.com']);
    $team = Team::factory()->create(['created_by' => $admin->id]);
    $invitation = TeamInvitation::factory()->create([
        'team_id' => $team->id,
        'email' => 'invited@example.com',
        'created_by' => $admin->id,
    ]);

    $response = $this->actingAs($user)
        ->get(route('teams.accept-invite', ['token' => $invitation->token]));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('teams/accept-invite')
        ->has('invitation')
        ->where('emailMismatch', true)
    );
});

test('unauthenticated user cannot accept invitation without signing in', function () {
    $admin = User::factory()->admin()->create();
    $team = Team::factory()->create(['created_by' => $admin->id]);
    $invitation = TeamInvitation::factory()->create([
        'team_id' => $team->id,
        'email' => 'newuser@example.com',
        'created_by' => $admin->id,
    ]);

    $response = $this->post(route('teams.accept-invite.post'), [
        'token' => $invitation->token,
        'email' => 'newuser@example.com',
    ]);

    $response->assertRedirect(route('login'));
    $response->assertSessionHas('info', 'Please sign in or create an account to accept the invitation.');

    // User should not be created yet
    $user = User::where('email', 'newuser@example.com')->first();
    expect($user)->toBeNull();

    // Invitation should not be marked as used
    $invitation->refresh();
    expect($invitation->used_at)->toBeNull();
});

test('unauthenticated user redirected to login with invitation token after attempting to accept', function () {
    $admin = User::factory()->admin()->create();
    $team = Team::factory()->create(['created_by' => $admin->id]);
    $invitation = TeamInvitation::factory()->create([
        'team_id' => $team->id,
        'email' => 'newuser@example.com',
        'created_by' => $admin->id,
    ]);

    $response = $this->post(route('teams.accept-invite.post'), [
        'token' => $invitation->token,
        'email' => 'newuser@example.com',
    ]);

    $response->assertRedirect(route('login', ['invitation_token' => $invitation->token]));
    expect($response->getSession()->get('invitation_token'))->toBe($invitation->token);
});
