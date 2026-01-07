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
import { sendMagicLinkInvite, store, update, destroy } from '@/actions/App/Http/Controllers/UserController';
import userRoutes from '@/routes/users';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Form, Head, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { MailIcon, PencilIcon, PlusIcon, SearchIcon, TrashIcon } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Users',
        href: userRoutes.index().url,
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

interface Team {
    id: number;
    name: string;
}

interface UsersIndexProps {
    users: User[];
    teamUsers: User[];
    teams: Team[];
    success?: string;
    search?: string;
    selectedTeamId?: number | null;
}

export default function UsersIndex({ users, teamUsers = [], teams = [], success, search = '', selectedTeamId = null }: UsersIndexProps) {
    const { auth, currentTeam } = usePage<SharedData>().props;
    const isAdmin = auth.user?.role === 'admin';
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState(search);
    const [selectedTeam, setSelectedTeam] = useState<string>(selectedTeamId?.toString() || 'all');

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
            case 'pending':
                return 'secondary';
            default:
                return 'outline';
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            router.get(
                userRoutes.index().url,
                {
                    search: searchTerm || undefined,
                    team_id: selectedTeam && selectedTeam !== 'all' ? selectedTeam : undefined,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                }
            );
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, selectedTeam]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {success && (
                    <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
                        {success}
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <CardTitle>Users</CardTitle>
                                <div className="flex items-center gap-2">
                                    {isAdmin && (
                                        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button variant="outline">
                                                    <MailIcon />
                                                    Send Magic Link Invite
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Send Magic Link Invite</DialogTitle>
                                                    <DialogDescription>
                                                        {currentTeam
                                                            ? `Send a magic link invitation to join ${currentTeam.name}. The user will be created with pending status until they accept the invitation.`
                                                            : 'No team selected. Please select a team first.'}
                                                    </DialogDescription>
                                                </DialogHeader>
                                                {currentTeam ? (
                                                    <Form
                                                        action={sendMagicLinkInvite()}
                                                        resetOnSuccess
                                                        onSuccess={() => setInviteDialogOpen(false)}
                                                        className="flex flex-col gap-4"
                                                    >
                                                        {({ processing, errors }) => (
                                                            <>
                                                                <div className="grid gap-4">
                                                                    <div className="grid gap-2">
                                                                        <Label htmlFor="invite-email">Email</Label>
                                                                        <Input
                                                                            id="invite-email"
                                                                            type="email"
                                                                            name="email"
                                                                            required
                                                                            placeholder="user@example.com"
                                                                        />
                                                                        <InputError message={errors.email} />
                                                                    </div>
                                                                </div>

                                                                <DialogFooter>
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        onClick={() => setInviteDialogOpen(false)}
                                                                    >
                                                                        Cancel
                                                                    </Button>
                                                                    <Button type="submit" disabled={processing}>
                                                                        {processing && <Spinner />}
                                                                        Send Invite
                                                                    </Button>
                                                                </DialogFooter>
                                                            </>
                                                        )}
                                                    </Form>
                                                ) : (
                                                    <DialogFooter>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={() => setInviteDialogOpen(false)}
                                                        >
                                                            Close
                                                        </Button>
                                                    </DialogFooter>
                                                )}
                                            </DialogContent>
                                        </Dialog>
                                    )}
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
                            </div>
                            <div className="flex gap-4">
                                <div className="relative flex-1">
                                    <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder="Search users by name..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                                <div className="w-64">
                                    <Select
                                        value={selectedTeam}
                                        onValueChange={setSelectedTeam}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Filter by team" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Teams</SelectItem>
                                            {teams.map((team) => (
                                                <SelectItem key={team.id} value={team.id.toString()}>
                                                    {team.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
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
                                                {searchTerm
                                                    ? `No users found matching "${searchTerm}".`
                                                    : 'No users found. Create your first user to get started.'}
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

                {selectedTeam && selectedTeam !== 'all' && (
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col gap-4">
                                <CardTitle>
                                    Team - {teams.find((t) => t.id.toString() === selectedTeam)?.name || 'Selected Team'}
                                </CardTitle>
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
                                        {teamUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                                                    {searchTerm
                                                        ? `No team users found matching "${searchTerm}".`
                                                        : 'No users found in this team.'}
                                                </td>
                                            </tr>
                                        ) : (
                                            teamUsers.map((user) => (
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
                )}
            </div>
        </AppLayout>
    );
}

