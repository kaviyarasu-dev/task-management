import { cn } from '@/shared/lib/utils';

interface ChartSkeletonProps {
  className?: string;
  height?: number;
  type?: 'bar' | 'line' | 'pie' | 'default';
}

export function ChartSkeleton({
  className,
  height = 300,
  type = 'default',
}: ChartSkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-background p-4',
        className
      )}
    >
      {/* Title skeleton */}
      <div className="mb-4 h-5 w-40 animate-pulse rounded bg-muted" />

      {/* Chart area skeleton */}
      <div
        className="animate-pulse rounded bg-muted"
        style={{ height }}
      >
        {type === 'pie' && (
          <div className="flex h-full items-center justify-center">
            <div className="h-40 w-40 rounded-full border-8 border-muted-foreground/20" />
          </div>
        )}
        {type === 'bar' && (
          <div className="flex h-full items-end justify-around px-8 pb-8">
            <div className="h-1/3 w-8 rounded-t bg-muted-foreground/20" />
            <div className="h-2/3 w-8 rounded-t bg-muted-foreground/20" />
            <div className="h-1/2 w-8 rounded-t bg-muted-foreground/20" />
            <div className="h-3/4 w-8 rounded-t bg-muted-foreground/20" />
            <div className="h-2/5 w-8 rounded-t bg-muted-foreground/20" />
          </div>
        )}
        {type === 'line' && (
          <div className="flex h-full items-center justify-center px-8">
            <svg
              className="h-1/2 w-full text-muted-foreground/20"
              viewBox="0 0 200 100"
              preserveAspectRatio="none"
            >
              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                points="0,80 40,50 80,70 120,30 160,50 200,20"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Legend skeleton */}
      <div className="mt-4 flex justify-center gap-4">
        <div className="h-4 w-16 animate-pulse rounded bg-muted" />
        <div className="h-4 w-16 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
