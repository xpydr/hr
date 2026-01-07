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
import { Spinner } from '@/components/ui/spinner';
import AppLayout from '@/layouts/app-layout';
import { store, update, destroy } from '@/actions/App/Http/Controllers/TeamController';
import teams from '@/routes/teams';
import { type BreadcrumbItem } from '@/types';
import { Form, Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { PencilIcon, PlusIcon, SearchIcon, TrashIcon, MailIcon } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Teams',
        href: teams.index().url,
    },
];

interface Team {
    id: number;
    name: string;
    description?: string | null;
    address?: string | null;
    phone?: string | null;
    website?: string | null;
    picture?: string | null;
    created_by?: string | null;
    created_at: string;
}

interface TeamsIndexProps {
    teams: Team[];
    success?: string;
    search?: string;
}

export default function TeamsIndex({ teams: teamsData, success, search = '' }: TeamsIndexProps) {
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [searchTerm, setSearchTerm] = useState(search);
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

    const handleDelete = (team: Team) => {
        if (confirm(`Are you sure you want to delete ${team.name}?`)) {
            router.delete(destroy(team.id).url, {
                preserveScroll: true,
            });
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            router.get(
                teams.index().url,
                { search: searchTerm || undefined },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                }
            );
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Teams" />
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
                                <CardTitle>Teams</CardTitle>
                                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button>
                                            <PlusIcon />
                                            Add Team
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Create New Team</DialogTitle>
                                            <DialogDescription>
                                                Add a new team with company information.
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
                                                            <Label htmlFor="name">Name *</Label>
                                                            <Input
                                                                id="name"
                                                                name="name"
                                                                required
                                                                placeholder="Team name"
                                                            />
                                                            <InputError message={errors.name} />
                                                        </div>

                                                        <div className="grid gap-2">
                                                            <Label htmlFor="description">Description</Label>
                                                            <textarea
                                                                id="description"
                                                                name="description"
                                                                className="min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                                placeholder="Team description"
                                                            />
                                                            <InputError message={errors.description} />
                                                        </div>

                                                        <div className="grid gap-2">
                                                            <Label htmlFor="address">Address</Label>
                                                            <Input
                                                                id="address"
                                                                name="address"
                                                                placeholder="Company address"
                                                            />
                                                            <InputError message={errors.address} />
                                                        </div>

                                                        <div className="grid gap-2">
                                                            <Label htmlFor="phone">Phone</Label>
                                                            <Input
                                                                id="phone"
                                                                name="phone"
                                                                placeholder="Phone number"
                                                            />
                                                            <InputError message={errors.phone} />
                                                        </div>

                                                        <div className="grid gap-2">
                                                            <Label htmlFor="website">Website</Label>
                                                            <Input
                                                                id="website"
                                                                name="website"
                                                                type="url"
                                                                placeholder="https://example.com"
                                                            />
                                                            <InputError message={errors.website} />
                                                        </div>

                                                        <div className="grid gap-2">
                                                            <Label htmlFor="picture">Picture</Label>
                                                            <Input
                                                                id="picture"
                                                                name="picture"
                                                                type="file"
                                                                accept="image/*"
                                                            />
                                                            <InputError message={errors.picture} />
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
                                                            Create Team
                                                        </Button>
                                                    </DialogFooter>
                                                </>
                                            )}
                                        </Form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Search teams by name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Description</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Created By</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Created</th>
                                        <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {teamsData.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                                                {searchTerm
                                                    ? `No teams found matching "${searchTerm}".`
                                                    : 'No teams found. Create your first team to get started.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        teamsData.map((team) => (
                                            <tr key={team.id} className="border-b">
                                                <td className="px-4 py-3 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        {team.picture && (
                                                            <img
                                                                src={team.picture}
                                                                alt={team.name}
                                                                className="size-8 rounded-md object-cover"
                                                            />
                                                        )}
                                                        <span className="font-medium">{team.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                                    {team.description || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                                    {team.created_by || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                                    {new Date(team.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedTeam(team);
                                                                setInviteDialogOpen(true);
                                                            }}
                                                        >
                                                            <MailIcon className="size-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            asChild
                                                        >
                                                            <Link href={teams.edit(team.id).url}>
                                                                <PencilIcon className="size-4" />
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDelete(team)}
                                                        >
                                                            <TrashIcon className="size-4" />
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

                {/* Invite Dialog */}
                <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Invite to Team</DialogTitle>
                            <DialogDescription>
                                Send an invitation to join {selectedTeam?.name}
                            </DialogDescription>
                        </DialogHeader>
                        {selectedTeam && (
                            <Form
                                action="/team-invitations"
                                method="post"
                                data={{
                                    team_id: selectedTeam.id,
                                }}
                                resetOnSuccess
                                onSuccess={() => setInviteDialogOpen(false)}
                                className="flex flex-col gap-4"
                            >
                                {({ processing, errors, data, setData }) => (
                                    <>
                                        <div className="grid gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="email">Email *</Label>
                                                <Input
                                                    id="email"
                                                    name="email"
                                                    type="email"
                                                    required
                                                    value={data.email || ''}
                                                    onChange={(e) => setData('email', e.target.value)}
                                                    placeholder="user@example.com"
                                                />
                                                <InputError message={errors.email} />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="method">Invitation Method *</Label>
                                                <select
                                                    id="method"
                                                    name="method"
                                                    required
                                                    value={data.method || 'both'}
                                                    onChange={(e) => setData('method', e.target.value)}
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                >
                                                    <option value="magic_link">Magic Link Only</option>
                                                    <option value="otp">OTP Code Only</option>
                                                    <option value="both">Both (Magic Link & OTP)</option>
                                                </select>
                                                <InputError message={errors.method} />
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
                                                Send Invitation
                                            </Button>
                                        </DialogFooter>
                                    </>
                                )}
                            </Form>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}

