import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Calendar,
  Users,
  Settings,
  FileText,
  type LucideIcon,
} from 'lucide-react';
import { ROUTES } from './routes';
import type { UserRole } from '@/shared/types/api.types';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  allowedRoles?: UserRole[];
}

export const mainNavItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: ROUTES.DASHBOARD,
    icon: LayoutDashboard,
  },
  {
    label: 'Projects',
    href: ROUTES.PROJECTS,
    icon: FolderKanban,
  },
  {
    label: 'Tasks',
    href: ROUTES.TASKS,
    icon: CheckSquare,
  },
  {
    label: 'Calendar',
    href: ROUTES.CALENDAR,
    icon: Calendar,
  },
  {
    label: 'Reports',
    href: ROUTES.REPORTS,
    icon: FileText,
    allowedRoles: ['owner', 'admin'],
  },
  {
    label: 'Team',
    href: ROUTES.TEAM,
    icon: Users,
  },
];

export const bottomNavItems: NavItem[] = [
  {
    label: 'Settings',
    href: ROUTES.SETTINGS,
    icon: Settings,
    allowedRoles: ['owner', 'admin'],
  },
];
