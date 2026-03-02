import { UserAvatar } from '@/shared/components/UserAvatar';
import { useIsOnline } from '../hooks/usePresence';
import { cn } from '@/shared/lib/utils';

interface OnlineIndicatorProps {
  userId: string;
  firstName: string;
  lastName: string;
  imageUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  showOfflineIndicator?: boolean;
  className?: string;
}

const indicatorSizes = {
  sm: 'h-2 w-2',
  md: 'h-3 w-3',
  lg: 'h-3.5 w-3.5',
};

export function OnlineIndicator({
  userId,
  firstName,
  lastName,
  imageUrl,
  size = 'md',
  showOfflineIndicator = false,
  className,
}: OnlineIndicatorProps) {
  const isOnline = useIsOnline(userId);

  const shouldShowIndicator = isOnline || showOfflineIndicator;

  return (
    <div className={cn('relative inline-flex', className)}>
      <UserAvatar
        firstName={firstName}
        lastName={lastName}
        imageUrl={imageUrl}
        size={size}
      />
      {shouldShowIndicator && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-background',
            indicatorSizes[size],
            isOnline ? 'bg-green-500' : 'bg-gray-400'
          )}
          aria-label={isOnline ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
}
