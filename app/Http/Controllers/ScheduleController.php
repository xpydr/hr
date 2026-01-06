<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreScheduleRequest;
use App\Http\Requests\UpdateScheduleRequest;
use App\Models\Schedule;
use App\UserRole;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ScheduleController extends Controller
{
    /**
     * Display a listing of the schedule.
     */
    public function index(Request $request): Response
    {
        $schedules = Schedule::query()
            ->orderBy('date')
            ->orderBy('start_time')
            ->get()
            ->map(fn (Schedule $schedule) => [
                'id' => $schedule->id,
                'date' => $schedule->date->format('Y-m-d'),
                'start_time' => $schedule->start_time,
                'end_time' => $schedule->end_time,
                'break_duration' => $schedule->break_duration,
                'shift_type' => $schedule->shift_type,
                'location' => $schedule->location,
                'notes' => $schedule->notes,
                'status' => $schedule->status,
                'is_recurring' => $schedule->is_recurring,
                'recurrence_pattern' => $schedule->recurrence_pattern,
                'created_at' => $schedule->created_at->toDateTimeString(),
            ]);

        $canManage = $this->canManageSchedules($request->user());

        return Inertia::render('schedule/index', [
            'schedules' => $schedules,
            'canManage' => $canManage,
        ]);
    }

    /**
     * Store a newly created shift in storage.
     */
    public function store(StoreScheduleRequest $request): RedirectResponse
    {
        if (! $this->canManageSchedules($request->user())) {
            abort(403);
        }

        Schedule::create($request->validated());

        return redirect()->route('schedule.index')->with('success', 'Shift created successfully.');
    }

    /**
     * Update the specified shift in storage.
     */
    public function update(UpdateScheduleRequest $request, Schedule $schedule): RedirectResponse
    {
        if (! $this->canManageSchedules($request->user())) {
            abort(403);
        }

        $schedule->update($request->validated());

        return redirect()->route('schedule.index')->with('success', 'Shift updated successfully.');
    }

    /**
     * Remove the specified shift from storage.
     */
    public function destroy(Request $request, Schedule $schedule): RedirectResponse
    {
        if (! $this->canManageSchedules($request->user())) {
            abort(403);
        }

        $schedule->delete();

        return redirect()->route('schedule.index')->with('success', 'Shift deleted successfully.');
    }

    /**
     * Check if the user can manage shifts (HR or Admin).
     */
    private function canManageSchedules($user): bool
    {
        if (! $user) {
            return false;
        }

        return in_array($user->role, [UserRole::Admin, UserRole::Hr], true);
    }
}
