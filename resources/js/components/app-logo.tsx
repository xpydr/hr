import AppLogoIcon from './app-logo-icon';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

interface AppLogoProps {
    onClick?: () => void;
}

export default function AppLogo({ onClick }: AppLogoProps) {
    const { currentTeam } = usePage<SharedData>().props;

    return (
        <div
            className="flex w-full items-center gap-2 cursor-pointer"
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick?.();
                }
            }}
        >
            <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground overflow-hidden shrink-0">
                {currentTeam?.picture ? (
                    <img
                        src={currentTeam.picture}
                        alt={currentTeam.name}
                        className="size-full object-cover"
                    />
                ) : (
                    <AppLogoIcon className="size-5 fill-current text-white dark:text-black" />
                )}
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm min-w-0">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    {currentTeam?.name || 'Laravel Starter Kit'}
                </span>
            </div>
        </div>
    );
}
