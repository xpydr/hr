import {
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import AppLogoIcon from '@/components/app-logo-icon';
import { type SharedData, type Team } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { Building2, Plus, Search } from 'lucide-react';
import teams from '@/routes/teams';

interface TeamSwitcherContentProps {
    onClose?: () => void;
}

export function TeamSwitcherContent({ onClose }: TeamSwitcherContentProps) {
    const { teams: userTeams = [], currentTeam, auth } = usePage<SharedData>().props;
    const isAdmin = auth.user?.role === 'admin';

    const handleSwitchTeam = (teamId: number | null) => {
        router.post(
            teams.switch().url,
            { team_id: teamId },
            {
                preserveScroll: true,
                preserveState: false,
                onSuccess: () => {
                    onClose?.();
                },
            }
        );
    };

    return (
        <>
            <DropdownMenuLabel>Switch Team</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={currentTeam?.id?.toString() || 'none'}>
                <DropdownMenuGroup>
                    {/* No Team Option */}
                    <DropdownMenuRadioItem
                        value="none"
                        onClick={() => handleSwitchTeam(null)}
                        className="cursor-pointer"
                    >
                        <div className="flex items-center gap-2">
                            <div className="flex size-6 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                                <AppLogoIcon className="size-4 fill-current text-white dark:text-black" />
                            </div>
                            <span>No Team</span>
                        </div>
                    </DropdownMenuRadioItem>

                    {/* User's Teams */}
                    {userTeams.map((team: Team) => (
                        <DropdownMenuRadioItem
                            key={team.id}
                            value={team.id.toString()}
                            onClick={() => handleSwitchTeam(team.id)}
                            className="cursor-pointer"
                        >
                            <div className="flex items-center gap-2">
                                {team.picture ? (
                                    <img
                                        src={team.picture}
                                        alt={team.name}
                                        className="size-6 rounded-md object-cover"
                                    />
                                ) : (
                                    <div className="flex size-6 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                                        <Building2 className="size-4" />
                                    </div>
                                )}
                                <span className="truncate">{team.name}</span>
                            </div>
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuGroup>
            </DropdownMenuRadioGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
                {/* Browse Teams */}
                <DropdownMenuItem asChild>
                    <Link
                        href={teams.browse().url}
                        className="cursor-pointer"
                        onClick={onClose}
                    >
                        <Search className="mr-2" />
                        Browse Teams
                    </Link>
                </DropdownMenuItem>

                {/* Create New Team (Admin only) */}
                {isAdmin && (
                    <DropdownMenuItem asChild>
                        <Link
                            href={teams.create().url}
                            className="cursor-pointer"
                            onClick={onClose}
                        >
                            <Plus className="mr-2" />
                            Create New Team
                        </Link>
                    </DropdownMenuItem>
                )}
            </DropdownMenuGroup>
        </>
    );
}

