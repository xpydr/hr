import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { markAsRead, markAllAsRead } from '@/actions/App/Http/Controllers/NotificationController';
import notifications from '@/routes/notifications';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Bell, Check, CheckCheck } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Notifications',
        href: notifications.index().url,
    },
];

interface Notification {
    id: number;
    title: string;
    message: string;
    type: string;
    sender: {
        id: number;
        name: string;
    } | null;
    read_at: string | null;
    created_at: string;
}

interface NotificationsIndexProps {
    notifications: Notification[];
}

export default function NotificationsIndex({ notifications }: NotificationsIndexProps) {
    const unreadCount = notifications.filter((n) => !n.read_at).length;

    const handleMarkAsRead = (notificationId: number) => {
        router.post(markAsRead(notificationId).url, {}, {
            preserveScroll: true,
        });
    };

    const handleMarkAllAsRead = () => {
        router.post(markAllAsRead().url, {}, {
            preserveScroll: true,
        });
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) {
            return 'Just now';
        }

        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) {
            return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
        }

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) {
            return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
        }

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) {
            return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
        }

        return date.toLocaleDateString();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Notifications" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Bell className="size-5" />
                                <CardTitle>Notifications</CardTitle>
                                {unreadCount > 0 && (
                                    <Badge variant="default" className="ml-2">
                                        {unreadCount} unread
                                    </Badge>
                                )}
                            </div>
                            {unreadCount > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleMarkAllAsRead}
                                >
                                    <CheckCheck className="size-4" />
                                    Mark all as read
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Bell className="mb-4 size-12 text-muted-foreground" />
                                <p className="text-lg font-medium text-muted-foreground">
                                    No notifications
                                </p>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    You're all caught up! New notifications will appear here.
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {notifications.map((notification) => {
                                    const isUnread = !notification.read_at;

                                    return (
                                        <div
                                            key={notification.id}
                                            className={`group relative rounded-lg border p-4 transition-colors ${
                                                isUnread
                                                    ? 'border-primary/50 bg-primary/5 dark:bg-primary/10'
                                                    : 'border-border bg-card hover:bg-accent/50'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-start gap-3">
                                                        {isUnread && (
                                                            <div className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                                                        )}
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <h3
                                                                    className={`font-semibold ${
                                                                        isUnread
                                                                            ? 'text-foreground'
                                                                            : 'text-muted-foreground'
                                                                    }`}
                                                                >
                                                                    {notification.title}
                                                                </h3>
                                                                {notification.type && (
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="text-xs"
                                                                    >
                                                                        {notification.type}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p
                                                                className={`mt-1 text-sm ${
                                                                    isUnread
                                                                        ? 'text-foreground'
                                                                        : 'text-muted-foreground'
                                                                }`}
                                                            >
                                                                {notification.message}
                                                            </p>
                                                            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                                                                {notification.sender && (
                                                                    <span>
                                                                        From:{' '}
                                                                        <span className="font-medium">
                                                                            {notification.sender.name}
                                                                        </span>
                                                                    </span>
                                                                )}
                                                                <span>{formatDate(notification.created_at)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                {isUnread && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                                                        onClick={() => handleMarkAsRead(notification.id)}
                                                        title="Mark as read"
                                                    >
                                                        <Check className="size-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

