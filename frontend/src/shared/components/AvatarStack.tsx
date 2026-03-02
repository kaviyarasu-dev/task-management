import { UserAvatar } from './UserAvatar';
import { cn } from '@/shared/lib/utils';
import type { User } from '@/shared/types/entities.types';

interface AvatarStackProps {
  users: User[];
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-6 w-6 text-xs',
  md: 'h-8 w-8 text-sm',
  lg: 'h-10 w-10 text-base',
};

export function AvatarStack({ users, max = 3, size = 'sm', className }: AvatarStackProps) {
  const displayed = users.slice(0, max);
  const remaining = users.length - max;

  return (
    <div className={cn('flex -space-x-2', className)}>
      {displayed.map((user, index) => (
        <div
          key={user._id}
          className="relative rounded-full ring-2 ring-background"
          style={{ zIndex: displayed.length - index }}
        >
          <UserAvatar firstName={user.firstName} lastName={user.lastName} size={size} />
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            'relative flex items-center justify-center rounded-full bg-muted ring-2 ring-background',
            sizeClasses[size]
          )}
          style={{ zIndex: 0 }}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
