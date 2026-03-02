import { cn, getInitials } from '@/shared/lib/utils';

interface UserAvatarProps {
  firstName: string;
  lastName: string;
  imageUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-6 w-6 text-xs',
  md: 'h-8 w-8 text-sm',
  lg: 'h-10 w-10 text-base',
};

export function UserAvatar({
  firstName,
  lastName,
  imageUrl,
  size = 'md',
  className,
}: UserAvatarProps) {
  const fullName = `${firstName} ${lastName}`.trim();

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={fullName}
        className={cn('rounded-full object-cover', sizeClasses[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-primary/10 font-medium text-primary',
        sizeClasses[size],
        className
      )}
      title={fullName}
    >
      {getInitials(firstName, lastName)}
    </div>
  );
}
