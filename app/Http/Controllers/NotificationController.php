<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    /**
     * Display a listing of the user's notifications.
     */
    public function index(Request $request): Response
    {
        $notifications = $request->user()
            ->receivedNotifications()
            ->with('sender')
            ->latest()
            ->get()
            ->map(fn (Notification $notification) => [
                'id' => $notification->id,
                'title' => $notification->title,
                'message' => $notification->message,
                'type' => $notification->type,
                'sender' => $notification->sender ? [
                    'id' => $notification->sender->id,
                    'name' => $notification->sender->name,
                ] : null,
                'read_at' => $notification->read_at?->toDateTimeString(),
                'created_at' => $notification->created_at->toDateTimeString(),
            ]);

        return Inertia::render('notifications/index', [
            'notifications' => $notifications,
        ]);
    }

    /**
     * Mark a notification as read.
     */
    public function markAsRead(Request $request, Notification $notification): RedirectResponse
    {
        if ($notification->recipient_id !== $request->user()->id) {
            abort(403);
        }

        if ($notification->read_at === null) {
            $notification->update(['read_at' => now()]);
        }

        return redirect()->route('notifications.index');
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead(Request $request): RedirectResponse
    {
        $request->user()
            ->receivedNotifications()
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return redirect()->route('notifications.index');
    }
}
