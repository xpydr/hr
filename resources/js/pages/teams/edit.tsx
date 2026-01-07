import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AppLayout from '@/layouts/app-layout';
import { update } from '@/actions/App/Http/Controllers/TeamController';
import teams from '@/routes/teams';
import { type BreadcrumbItem } from '@/types';
import { Form, Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Teams',
        href: teams.index().url,
    },
    {
        title: 'Edit Team',
        href: '#',
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
}

interface EditTeamProps {
    team: Team;
}

export default function EditTeam({ team }: EditTeamProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Team" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Edit Team</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Form
                            action={update(team.id)}
                            method="patch"
                            className="flex flex-col gap-4"
                        >
                            {({ processing, errors, data, setData }) => (
                                <>
                                    <div className="grid gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="name">Name *</Label>
                                            <Input
                                                id="name"
                                                name="name"
                                                required
                                                value={data.name || team.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                placeholder="Team name"
                                            />
                                            <InputError message={errors.name} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="description">Description</Label>
                                            <textarea
                                                id="description"
                                                name="description"
                                                value={data.description ?? team.description ?? ''}
                                                onChange={(e) => setData('description', e.target.value)}
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
                                                value={data.address ?? team.address ?? ''}
                                                onChange={(e) => setData('address', e.target.value)}
                                                placeholder="Company address"
                                            />
                                            <InputError message={errors.address} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="phone">Phone</Label>
                                            <Input
                                                id="phone"
                                                name="phone"
                                                value={data.phone ?? team.phone ?? ''}
                                                onChange={(e) => setData('phone', e.target.value)}
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
                                                value={data.website ?? team.website ?? ''}
                                                onChange={(e) => setData('website', e.target.value)}
                                                placeholder="https://example.com"
                                            />
                                            <InputError message={errors.website} />
                                        </div>

                                        {team.picture && (
                                            <div className="grid gap-2">
                                                <Label>Current Picture</Label>
                                                <img
                                                    src={team.picture}
                                                    alt={team.name}
                                                    className="size-32 rounded-md object-cover"
                                                />
                                            </div>
                                        )}

                                        <div className="grid gap-2">
                                            <Label htmlFor="picture">New Picture</Label>
                                            <Input
                                                id="picture"
                                                name="picture"
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        setData('picture', file);
                                                    }
                                                }}
                                            />
                                            <InputError message={errors.picture} />
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => window.history.back()}
                                        >
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={processing}>
                                            {processing && <Spinner />}
                                            Update Team
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

