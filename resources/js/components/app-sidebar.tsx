import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { dashboard } from '@/routes';
import notifications from '@/routes/notifications';
import schedule from '@/routes/schedule/index';
import users from '@/routes/users';
import { type NavItem, type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { Bell, Calendar, LayoutGrid, Users } from 'lucide-react';
import AppLogo from './app-logo';
import { TeamSwitcherContent } from './team-switcher';

export function AppSidebar() {
    const { unreadNotificationCount = 0 } = usePage<SharedData>().props;

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: dashboard(),
            icon: LayoutGrid,
        },
        {
            title: 'Users',
            href: users.index(),
            icon: Users,
        },
        {
            title: 'Schedule',
            href: schedule.index(),
            icon: Calendar,
        },
        {
            title: 'Notifications',
            href: notifications.index(),
            icon: Bell,
            badge: unreadNotificationCount,
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton size="lg" className="w-full">
                                    <AppLogo />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-[var(--radix-dropdown-menu-trigger-width)]"
                                align="start"
                                side="right"
                                sideOffset={4}
                            >
                                <TeamSwitcherContent />
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
