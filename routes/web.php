<?php

use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\TeamInvitationController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [UserController::class, 'index'])->name('dashboard');
    Route::get('users', [UserController::class, 'usersIndex'])->name('users.index');
    Route::post('users', [UserController::class, 'store'])->name('users.store');
    Route::patch('users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::delete('users/{user}', [UserController::class, 'destroy'])->name('users.destroy');

    Route::get('notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('notifications', [NotificationController::class, 'store'])->name('notifications.store');
    Route::post('notifications/{notification}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::post('notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');

    Route::get('schedule', [ScheduleController::class, 'index'])->name('schedule.index');
    Route::get('my-schedule', [ScheduleController::class, 'mySchedule'])->name('schedule.my-schedule');
    Route::post('schedule', [ScheduleController::class, 'store'])->name('schedule.store');
    Route::patch('schedule/{schedule}', [ScheduleController::class, 'update'])->name('schedule.update');
    Route::delete('schedule/{schedule}', [ScheduleController::class, 'destroy'])->name('schedule.destroy');

    Route::get('teams', [TeamController::class, 'index'])->name('teams.index');
    Route::get('teams/create', [TeamController::class, 'create'])->name('teams.create');
    Route::post('teams', [TeamController::class, 'store'])->name('teams.store');
    Route::get('teams/{team}', [TeamController::class, 'show'])->name('teams.show');
    Route::get('teams/{team}/edit', [TeamController::class, 'edit'])->name('teams.edit');
    Route::patch('teams/{team}', [TeamController::class, 'update'])->name('teams.update');
    Route::delete('teams/{team}', [TeamController::class, 'destroy'])->name('teams.destroy');

    Route::post('team-invitations', [TeamInvitationController::class, 'store'])->name('team-invitations.store');
});

// Public route for accepting invitations
Route::get('teams/accept-invite/{token}', [TeamInvitationController::class, 'show'])
    ->middleware('signed')
    ->name('teams.accept-invite');
Route::post('teams/accept-invite', [TeamInvitationController::class, 'accept'])->name('teams.accept-invite.post');

require __DIR__.'/settings.php';
