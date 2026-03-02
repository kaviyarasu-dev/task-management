import {
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  UserPlus,
  UserMinus,
  MessageSquare,
  FolderPlus,
  Mail,
  MailCheck,
  MailX,
  Building,
  Circle,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { ActivityAction, ActivityEntityType } from '../types/activity.types';

interface ActivityIconProps {
  action: ActivityAction;
  entityType: ActivityEntityType;
  className?: string;
}

interface IconConfig {
  icon: LucideIcon;
  bgColor: string;
  iconColor: string;
}

const iconConfigMap: Record<ActivityAction, IconConfig> = {
  // Task actions
  'task.created': {
    icon: Plus,
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  'task.updated': {
    icon: Edit,
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  'task.assigned': {
    icon: UserPlus,
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  'task.completed': {
    icon: CheckCircle,
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  'task.deleted': {
    icon: Trash2,
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    iconColor: 'text-red-600 dark:text-red-400',
  },

  // Comment actions
  'comment.created': {
    icon: MessageSquare,
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  'comment.updated': {
    icon: Edit,
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  'comment.deleted': {
    icon: Trash2,
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    iconColor: 'text-red-600 dark:text-red-400',
  },

  // Project actions
  'project.created': {
    icon: FolderPlus,
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  'project.updated': {
    icon: Edit,
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  'project.deleted': {
    icon: Trash2,
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    iconColor: 'text-red-600 dark:text-red-400',
  },

  // Status actions
  'status.created': {
    icon: Circle,
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  'status.updated': {
    icon: Circle,
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  'status.deleted': {
    icon: Circle,
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    iconColor: 'text-red-600 dark:text-red-400',
  },

  // User/Invitation actions
  'user.invited': {
    icon: Mail,
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  'user.removed': {
    icon: UserMinus,
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  'invitation.created': {
    icon: Mail,
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  'invitation.accepted': {
    icon: MailCheck,
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  'invitation.cancelled': {
    icon: MailX,
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    iconColor: 'text-red-600 dark:text-red-400',
  },

  // Tenant actions
  'tenant.created': {
    icon: Building,
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-600 dark:text-green-400',
  },
};

const defaultConfig: IconConfig = {
  icon: Circle,
  bgColor: 'bg-muted',
  iconColor: 'text-muted-foreground',
};

export function ActivityIcon({ action, className }: ActivityIconProps) {
  const config = iconConfigMap[action] ?? defaultConfig;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-full',
        config.bgColor,
        className
      )}
    >
      <Icon className={cn('h-4 w-4', config.iconColor)} />
    </div>
  );
}
