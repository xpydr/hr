import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { join } from '@/actions/App/Http/Controllers/TeamController';
import teams from '@/routes/teams';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Building2, SearchIcon, Users } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Teams',
        href: teams.index().url,
    },
    {
        title: 'Browse Teams',
        href: teams.browse().url,
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
    member_count: number;
    created_at: string;
}

interface BrowseTeamsProps {
    teams: Team[];
    success?: string;
    error?: string;
    search?: string;
}

export default function BrowseTeams({ teams: teamsData, success, error, search = '' }: BrowseTeamsProps) {
    const [searchTerm, setSearchTerm] = useState(search);

    const handleJoin = (team: Team) => {
        if (confirm(`Are you sure you want to join ${team.name}?`)) {
            router.post(join(team.id).url, {}, {
                preserveScroll: true,
            });
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            router.get(
                teams.browse().url,
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
            <Head title="Browse Teams" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {success && (
                    <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
                        {success}
                    </div>
                )}

                {error && (
                    <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
                        {error}
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <CardTitle>Browse Teams</CardTitle>
                                <Button asChild variant="outline">
                                    <Link href={teams.index().url}>
                                        Manage Teams
                                    </Link>
                                </Button>
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
                        {teamsData.length === 0 ? (
                            <div className="py-8 text-center text-sm text-muted-foreground">
                                {searchTerm
                                    ? `No teams found matching "${searchTerm}".`
                                    : 'No teams available to join.'}
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {teamsData.map((team) => (
                                    <Card key={team.id}>
                                        <CardHeader>
                                            <div className="flex items-start gap-4">
                                                {team.picture ? (
                                                    <img
                                                        src={team.picture}
                                                        alt={team.name}
                                                        className="size-16 rounded-md object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex size-16 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                                                        <Building2 className="size-8" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <CardTitle className="text-lg mb-1">{team.name}</CardTitle>
                                                    {team.description && (
                                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                                            {team.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Users className="size-4" />
                                                    <span>{team.member_count} member{team.member_count !== 1 ? 's' : ''}</span>
                                                </div>
                                                {team.address && (
                                                    <div className="text-sm text-muted-foreground">
                                                        {team.address}
                                                    </div>
                                                )}
                                                {team.website && (
                                                    <div className="text-sm">
                                                        <a
                                                            href={team.website}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-primary hover:underline"
                                                        >
                                                            {team.website}
                                                        </a>
                                                    </div>
                                                )}
                                                <div className="pt-2">
                                                    <Button
                                                        onClick={() => handleJoin(team)}
                                                        className="w-full"
                                                    >
                                                        Join Team
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

