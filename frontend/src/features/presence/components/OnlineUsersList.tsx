import type { User } from '@/shared/types/entities.types';
import { OnlineIndicator } from './OnlineIndicator';
import { useOnlineUserIds, useOnlineCount } from '../stores/presenceStore';
import { cn } from '@/shared/lib/utils';

interface OnlineUsersListProps {
  users: User[];
  className?: string;
}

export function OnlineUsersList({ users, className }: OnlineUsersListProps) {
  const onlineUserIds = useOnlineUserIds();
  const onlineCount = useOnlineCount();

  // Filter to show only online users
  const onlineUsers = users.filter((user) => onlineUserIds.includes(user._id));

  if (onlineUsers.length === 0) {
    return (
      <div className={cn('text-sm text-muted-foreground', className)}>
        No users online
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="h-2 w-2 rounded-full bg-green-500" />
        <span>{onlineCount} online</span>
      </div>
      <ul className="space-y-1">
        {onlineUsers.map((user) => (
          <li
            key={user._id}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted"
          >
            <OnlineIndicator
              userId={user._id}
              firstName={user.firstName}
              lastName={user.lastName}
              size="sm"
            />
            <span className="text-sm font-medium">
              {user.firstName} {user.lastName}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
