import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AppLayout from '@/layouts/app-layout';
import { markAsRead, markAsUnread, markAllAsRead, store } from '@/actions/App/Http/Controllers/NotificationController';
import notifications from '@/routes/notifications';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Form, Head, router, usePage } from '@inertiajs/react';
import { Bell, Check, CheckCheck, MoreVertical, Plus } from 'lucide-react';
import { useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

interface UserOption {
    id: number;
    name: string;
    email: string;
}

interface NotificationsIndexProps {
    notifications: Notification[];
    users: UserOption[];
    success?: string;
}

export default function NotificationsIndex({ notifications, users, success }: NotificationsIndexProps) {
    const { auth } = usePage<SharedData>().props;
    const isAdmin = auth.user.role === 'admin';
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [selectedRecipients, setSelectedRecipients] = useState<number[]>([]);

    const unreadCount = notifications.filter((n) => !n.read_at).length;

    const handleMarkAsRead = (notificationId: number) => {
        router.post(markAsRead(notificationId).url, {}, {
            preserveScroll: true,
        });
    };

    const handleMarkAsUnread = (notificationId: number) => {
        router.post(markAsUnread(notificationId).url, {}, {
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

    const handleSelectEveryone = () => {
        setSelectedRecipients(users.map((user) => user.id));
    };

    const handleRecipientToggle = (userId: number) => {
        setSelectedRecipients((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Notifications" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {success && (
                    <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
                        {success}
                    </div>
                )}

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
                            <div className="flex items-center gap-2">
                                {isAdmin && (
                                    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button size="sm">
                                                <Plus className="size-4" />
                                                Create Notification
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-h-[90vh] overflow-y-auto">
                                            <DialogHeader>
                                                <DialogTitle>Create New Notification</DialogTitle>
                                                <DialogDescription>
                                                    Send a notification to selected recipients. All fields are required.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <Form
                                                action={store()}
                                                resetOnSuccess
                                                onSuccess={() => {
                                                    setCreateDialogOpen(false);
                                                    setSelectedRecipients([]);
                                                }}
                                                className="flex flex-col gap-4"
                                            >
                                                {({ processing, errors }) => (
                                                    <>
                                                        <div className="grid gap-4">
                                                            <div className="grid gap-2">
                                                                <Label htmlFor="title">Title</Label>
                                                                <Input
                                                                    id="title"
                                                                    name="title"
                                                                    required
                                                                    placeholder="Notification title"
                                                                />
                                                                <InputError message={errors.title} />
                                                            </div>

                                                            <div className="grid gap-2">
                                                                <Label htmlFor="message">Message</Label>
                                                                <textarea
                                                                    id="message"
                                                                    name="message"
                                                                    required
                                                                    rows={4}
                                                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                                    placeholder="Notification message"
                                                                />
                                                                <InputError message={errors.message} />
                                                            </div>

                                                            <div className="grid gap-2">
                                                                <Label htmlFor="type">Type</Label>
                                                                <Input
                                                                    id="type"
                                                                    name="type"
                                                                    required
                                                                    placeholder="e.g., announcement, alert, info"
                                                                />
                                                                <InputError message={errors.type} />
                                                            </div>

                                                            <div className="grid gap-2">
                                                                <div className="flex items-center justify-between">
                                                                    <Label htmlFor="recipients">Recipients</Label>
                                                                    {isAdmin && (
                                                                        <Button
                                                                            type="button"
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={handleSelectEveryone}
                                                                        >
                                                                            Select Everyone
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                                <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
                                                                    {users.length === 0 ? (
                                                                        <p className="text-sm text-muted-foreground">
                                                                            No users available
                                                                        </p>
                                                                    ) : (
                                                                        users.map((user) => (
                                                                            <div
                                                                                key={user.id}
                                                                                className="flex items-center space-x-2"
                                                                            >
                                                                                <Checkbox
                                                                                    id={`recipient-${user.id}`}
                                                                                    checked={selectedRecipients.includes(user.id)}
                                                                                    onCheckedChange={() =>
                                                                                        handleRecipientToggle(user.id)
                                                                                    }
                                                                                />
                                                                                <Label
                                                                                    htmlFor={`recipient-${user.id}`}
                                                                                    className="flex-1 cursor-pointer text-sm font-normal"
                                                                                >
                                                                                    {user.name} ({user.email})
                                                                                </Label>
                                                                            </div>
                                                                        ))
                                                                    )}
                                                                </div>
                                                                {selectedRecipients.map((recipientId) => (
                                                                    <input
                                                                        key={recipientId}
                                                                        type="hidden"
                                                                        name="recipient_ids[]"
                                                                        value={recipientId}
                                                                    />
                                                                ))}
                                                                <InputError message={errors.recipient_ids} />
                                                            </div>
                                                        </div>

                                                        <DialogFooter>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                onClick={() => {
                                                                    setCreateDialogOpen(false);
                                                                    setSelectedRecipients([]);
                                                                }}
                                                            >
                                                                Cancel
                                                            </Button>
                                                            <Button type="submit" disabled={processing || selectedRecipients.length === 0}>
                                                                {processing && <Spinner />}
                                                                Create Notification
                                                            </Button>
                                                        </DialogFooter>
                                                    </>
                                                )}
                                            </Form>
                                        </DialogContent>
                                    </Dialog>
                                )}
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
                                                <div className="flex items-center gap-1">
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
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="shrink-0"
                                                                title="More options"
                                                            >
                                                                <MoreVertical className="size-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            {!isUnread && (
                                                                <DropdownMenuItem
                                                                    onClick={() => handleMarkAsUnread(notification.id)}
                                                                >
                                                                    Mark as unread
                                                                </DropdownMenuItem>
                                                            )}
                                                            {isUnread && (
                                                                <DropdownMenuItem
                                                                    onClick={() => handleMarkAsRead(notification.id)}
                                                                >
                                                                    Mark as read
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
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

