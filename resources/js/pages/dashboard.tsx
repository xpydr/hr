import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import AppLayout from '@/layouts/app-layout';
import { store, update, destroy } from '@/actions/App/Http/Controllers/UserController';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Form, Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { PencilIcon, PlusIcon, TrashIcon } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    status: string;
    created_at: string;
}

interface DashboardProps {
    users: User[];
    success?: string;
}

export default function Dashboard({ users, success }: DashboardProps) {
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const handleDelete = (user: User) => {
        if (confirm(`Are you sure you want to delete ${user.name}?`)) {
            router.delete(destroy(user.id).url, {
                preserveScroll: true,
            });
        }
    };

    const getRoleBadgeVariant = (role: string) => {
        switch (role) {
            case 'admin':
                return 'destructive';
            case 'hr':
                return 'secondary';
            default:
                return 'outline';
        }
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'active':
                return 'default';
            case 'inactive':
                return 'secondary';
            case 'suspended':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {success && (
                    <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
                        {success}
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Users</CardTitle>
                            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <PlusIcon />
                                        Add User
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Create New User</DialogTitle>
                                        <DialogDescription>
                                            Add a new user to the system. All fields are required.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <Form
                                        action={store()}
                                        resetOnSuccess
                                        onSuccess={() => setCreateDialogOpen(false)}
                                        className="flex flex-col gap-4"
                                    >
                                        {({ processing, errors }) => (
                                            <>
                                                <div className="grid gap-4">
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="name">Name</Label>
                                                        <Input
                                                            id="name"
                                                            name="name"
                                                            required
                                                            placeholder="John Doe"
                                                        />
                                                        <InputError message={errors.name} />
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <Label htmlFor="email">Email</Label>
                                                        <Input
                                                            id="email"
                                                            type="email"
                                                            name="email"
                                                            required
                                                            placeholder="john@example.com"
                                                        />
                                                        <InputError message={errors.email} />
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <Label htmlFor="password">Password</Label>
                                                        <Input
                                                            id="password"
                                                            type="password"
                                                            name="password"
                                                            required
                                                            placeholder="Password"
                                                        />
                                                        <InputError message={errors.password} />
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <Label htmlFor="role">Role</Label>
                                                        <Select
                                                            onValueChange={(value) => {
                                                                const input = document.querySelector<HTMLInputElement>('input[name="role"]');
                                                                if (input) {
                                                                    input.value = value;
                                                                }
                                                            }}
                                                        >
                                                            <SelectTrigger id="role">
                                                                <SelectValue placeholder="Select role" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="admin">Admin</SelectItem>
                                                                <SelectItem value="hr">HR</SelectItem>
                                                                <SelectItem value="employee">Employee</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <input type="hidden" name="role" required />
                                                        <InputError message={errors.role} />
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <Label htmlFor="status">Status</Label>
                                                        <Select
                                                            onValueChange={(value) => {
                                                                const input = document.querySelector<HTMLInputElement>('input[name="status"]');
                                                                if (input) {
                                                                    input.value = value;
                                                                }
                                                            }}
                                                        >
                                                            <SelectTrigger id="status">
                                                                <SelectValue placeholder="Select status" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="active">Active</SelectItem>
                                                                <SelectItem value="inactive">Inactive</SelectItem>
                                                                <SelectItem value="suspended">Suspended</SelectItem>
                                                                <SelectItem value="terminated">Terminated</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <input type="hidden" name="status" required />
                                                        <InputError message={errors.status} />
                                                    </div>
                                                </div>

                                                <DialogFooter>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => setCreateDialogOpen(false)}
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button type="submit" disabled={processing}>
                                                        {processing && <Spinner />}
                                                        Create User
                                                    </Button>
                                                </DialogFooter>
                                            </>
                                        )}
                                    </Form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Role</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Created</th>
                                        <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                                                No users found. Create your first user to get started.
                                            </td>
                                        </tr>
                                    ) : (
                                        users.map((user) => (
                                            <tr key={user.id} className="border-b">
                                                <td className="px-4 py-3 text-sm">{user.name}</td>
                                                <td className="px-4 py-3 text-sm">{user.email}</td>
                                                <td className="px-4 py-3 text-sm">
                                                    <Badge variant={getRoleBadgeVariant(user.role)}>
                                                        {user.role}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    <Badge variant={getStatusBadgeVariant(user.status)}>
                                                        {user.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                                    {new Date(user.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Dialog
                                                            open={editingUser?.id === user.id}
                                                            onOpenChange={(open) =>
                                                                setEditingUser(open ? user : null)
                                                            }
                                                        >
                                                            <DialogTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <PencilIcon />
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent>
                                                                <DialogHeader>
                                                                    <DialogTitle>Edit User</DialogTitle>
                                                                    <DialogDescription>
                                                                        Update user information. Leave password blank to keep the current password.
                                                                    </DialogDescription>
                                                                </DialogHeader>
                                                                <Form
                                                                    action={update(user.id)}
                                                                    resetOnSuccess
                                                                    onSuccess={() => setEditingUser(null)}
                                                                    className="flex flex-col gap-4"
                                                                >
                                                                    {({ processing, errors }) => (
                                                                        <>
                                                                            <div className="grid gap-4">
                                                                                <div className="grid gap-2">
                                                                                    <Label htmlFor={`edit-name-${user.id}`}>Name</Label>
                                                                                    <Input
                                                                                        id={`edit-name-${user.id}`}
                                                                                        name="name"
                                                                                        defaultValue={user.name}
                                                                                        required
                                                                                    />
                                                                                    <InputError message={errors.name} />
                                                                                </div>

                                                                                <div className="grid gap-2">
                                                                                    <Label htmlFor={`edit-email-${user.id}`}>Email</Label>
                                                                                    <Input
                                                                                        id={`edit-email-${user.id}`}
                                                                                        type="email"
                                                                                        name="email"
                                                                                        defaultValue={user.email}
                                                                                        required
                                                                                    />
                                                                                    <InputError message={errors.email} />
                                                                                </div>

                                                                                <div className="grid gap-2">
                                                                                    <Label htmlFor={`edit-password-${user.id}`}>Password (leave blank to keep current)</Label>
                                                                                    <Input
                                                                                        id={`edit-password-${user.id}`}
                                                                                        type="password"
                                                                                        name="password"
                                                                                        placeholder="New password"
                                                                                    />
                                                                                    <InputError message={errors.password} />
                                                                                </div>

                                                                                <div className="grid gap-2">
                                                                                    <Label htmlFor={`edit-role-${user.id}`}>Role</Label>
                                                                                    <Select
                                                                                        defaultValue={user.role}
                                                                                        onValueChange={(value) => {
                                                                                            const input = document.querySelector<HTMLInputElement>(`input[name="role"][data-user-id="${user.id}"]`);
                                                                                            if (input) {
                                                                                                input.value = value;
                                                                                            }
                                                                                        }}
                                                                                    >
                                                                                        <SelectTrigger id={`edit-role-${user.id}`}>
                                                                                            <SelectValue />
                                                                                        </SelectTrigger>
                                                                                        <SelectContent>
                                                                                            <SelectItem value="admin">Admin</SelectItem>
                                                                                            <SelectItem value="hr">HR</SelectItem>
                                                                                            <SelectItem value="employee">Employee</SelectItem>
                                                                                        </SelectContent>
                                                                                    </Select>
                                                                                    <input type="hidden" name="role" data-user-id={user.id} defaultValue={user.role} required />
                                                                                    <InputError message={errors.role} />
                                                                                </div>

                                                                                <div className="grid gap-2">
                                                                                    <Label htmlFor={`edit-status-${user.id}`}>Status</Label>
                                                                                    <Select
                                                                                        defaultValue={user.status}
                                                                                        onValueChange={(value) => {
                                                                                            const input = document.querySelector<HTMLInputElement>(`input[name="status"][data-user-id="${user.id}"]`);
                                                                                            if (input) {
                                                                                                input.value = value;
                                                                                            }
                                                                                        }}
                                                                                    >
                                                                                        <SelectTrigger id={`edit-status-${user.id}`}>
                                                                                            <SelectValue />
                                                                                        </SelectTrigger>
                                                                                        <SelectContent>
                                                                                            <SelectItem value="active">Active</SelectItem>
                                                                                            <SelectItem value="inactive">Inactive</SelectItem>
                                                                                            <SelectItem value="suspended">Suspended</SelectItem>
                                                                                            <SelectItem value="terminated">Terminated</SelectItem>
                                                                                        </SelectContent>
                                                                                    </Select>
                                                                                    <input type="hidden" name="status" data-user-id={user.id} defaultValue={user.status} required />
                                                                                    <InputError message={errors.status} />
                                                                                </div>
                                                                            </div>

                                                                            <DialogFooter>
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="outline"
                                                                                    onClick={() => setEditingUser(null)}
                                                                                >
                                                                                    Cancel
                                                                                </Button>
                                                                                <Button type="submit" disabled={processing}>
                                                                                    {processing && <Spinner />}
                                                                                    Update User
                                                                                </Button>
                                                                            </DialogFooter>
                                                                        </>
                                                                    )}
                                                                </Form>
                                                            </DialogContent>
                                                        </Dialog>

                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDelete(user)}
                                                        >
                                                            <TrashIcon />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
