import type { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

type StatsCardVariant = 'default' | 'warning' | 'success' | 'info';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: StatsCardVariant;
  isLoading?: boolean;
  className?: string;
}

const variantStyles: Record<StatsCardVariant, { icon: string; background: string }> = {
  default: {
    icon: 'text-primary',
    background: 'bg-primary/10',
  },
  warning: {
    icon: 'text-orange-500',
    background: 'bg-orange-500/10',
  },
  success: {
    icon: 'text-green-500',
    background: 'bg-green-500/10',
  },
  info: {
    icon: 'text-blue-500',
    background: 'bg-blue-500/10',
  },
};

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  variant = 'default',
  isLoading,
  className,
}: StatsCardProps) {
  const styles = variantStyles[variant];

  if (isLoading) {
    return (
      <div
        className={cn(
          'rounded-lg border border-border bg-background p-6',
          className
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="mt-3 h-8 w-16 animate-pulse rounded bg-muted" />
            {trend && (
              <div className="mt-2 h-4 w-32 animate-pulse rounded bg-muted" />
            )}
          </div>
          <div className={cn('rounded-full p-3', styles.background)}>
            <Icon className={cn('h-6 w-6', styles.icon)} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-background p-6',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
          {trend && (
            <p
              className={cn(
                'mt-1 text-sm',
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              )}
            >
              {trend.isPositive ? '+' : ''}{trend.value}% from last week
            </p>
          )}
        </div>
        <div className={cn('rounded-full p-3', styles.background)}>
          <Icon className={cn('h-6 w-6', styles.icon)} />
        </div>
      </div>
    </div>
  );
}
