import { formatRelativeTime } from '@/shared/lib/utils';
import { UserAvatar } from '@/shared/components/UserAvatar';
import { ActivityIcon } from './ActivityIcon';
import type { Activity } from '../types/activity.types';

interface ActivityItemProps {
  activity: Activity;
  showTimestamp?: boolean;
}

/**
 * Maps action to human-readable description
 */
function getActionDescription(activity: Activity): string {
  const metadata = activity.metadata as Record<string, unknown>;

  switch (activity.action) {
    // Task actions
    case 'task.created':
      return `created task "${metadata.title ?? 'Untitled'}"`;
    case 'task.updated':
      return `updated task "${metadata.title ?? metadata.taskTitle ?? 'a task'}"`;
    case 'task.assigned':
      return metadata.assigneeName
        ? `assigned task to ${metadata.assigneeName}`
        : `assigned a task`;
    case 'task.completed':
      return `completed task "${metadata.title ?? metadata.taskTitle ?? 'a task'}"`;
    case 'task.deleted':
      return `deleted task "${metadata.title ?? metadata.taskTitle ?? 'a task'}"`;

    // Comment actions
    case 'comment.created':
      return `added a comment`;
    case 'comment.updated':
      return `edited a comment`;
    case 'comment.deleted':
      return `deleted a comment`;

    // Project actions
    case 'project.created':
      return `created project "${metadata.name ?? metadata.projectName ?? 'Untitled'}"`;
    case 'project.updated':
      return `updated project "${metadata.name ?? metadata.projectName ?? 'a project'}"`;
    case 'project.deleted':
      return `deleted project "${metadata.name ?? metadata.projectName ?? 'a project'}"`;

    // Status actions
    case 'status.created':
      return `created status "${metadata.name ?? 'a status'}"`;
    case 'status.updated':
      return `updated status "${metadata.name ?? 'a status'}"`;
    case 'status.deleted':
      return `deleted status "${metadata.name ?? 'a status'}"`;

    // User/Invitation actions
    case 'user.invited':
      return `invited ${metadata.email ?? 'a user'} to the team`;
    case 'user.removed':
      return `removed ${metadata.email ?? metadata.userName ?? 'a user'} from the team`;
    case 'invitation.created':
      return `sent an invitation to ${metadata.email ?? 'a user'}`;
    case 'invitation.accepted':
      return `accepted the invitation and joined the team`;
    case 'invitation.cancelled':
      return `cancelled an invitation`;

    // Tenant actions
    case 'tenant.created':
      return `created the workspace`;

    default:
      return `performed an action`;
  }
}

export function ActivityItem({ activity, showTimestamp = true }: ActivityItemProps) {
  const actor = activity.actorId;
  const description = getActionDescription(activity);

  return (
    <div className="flex gap-3">
      {/* Icon */}
      <div className="flex-shrink-0">
        <ActivityIcon action={activity.action} entityType={activity.entityType} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          {/* Actor avatar */}
          <UserAvatar
            firstName={actor.firstName}
            lastName={actor.lastName}
            size="sm"
          />

          {/* Description */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground">
              <span className="font-medium">
                {actor.firstName} {actor.lastName}
              </span>{' '}
              <span className="text-muted-foreground">{description}</span>
            </p>

            {/* Timestamp */}
            {showTimestamp && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatRelativeTime(activity.occurredAt)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact variant for widgets and sidebars
 */
export function ActivityItemCompact({ activity }: { activity: Activity }) {
  const actor = activity.actorId;
  const description = getActionDescription(activity);

  return (
    <div className="flex items-start gap-2">
      <ActivityIcon
        action={activity.action}
        entityType={activity.entityType}
        className="h-6 w-6"
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-foreground truncate">
          <span className="font-medium">
            {actor.firstName} {actor.lastName}
          </span>{' '}
          <span className="text-muted-foreground">{description}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {formatRelativeTime(activity.occurredAt)}
        </p>
      </div>
    </div>
  );
}
