import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
    badge?: number;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    sidebarOpen: boolean;
    unreadNotificationCount?: number;
    teams?: Team[];
    currentTeam?: Team | null;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    role?: string;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}

export interface Team {
    id: number;
    name: string;
    description?: string | null;
    address?: string | null;
    phone?: string | null;
    website?: string | null;
    picture?: string | null;
    created_by?: number;
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
}

export interface TeamInvitation {
    id: number;
    team_id: number;
    email: string;
    token: string;
    otp_code?: string | null;
    expires_at: string;
    used_at?: string | null;
    created_by: number;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}
