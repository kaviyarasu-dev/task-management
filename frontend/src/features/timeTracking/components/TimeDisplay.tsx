import { cn } from '@/shared/lib/utils';

interface TimeDisplayProps {
  seconds?: number;
  minutes?: number;
  className?: string;
  showSeconds?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Formats seconds into a human-readable duration string.
 */
export function formatDuration(totalSeconds: number, showSeconds = true): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    if (showSeconds) {
      return `${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
    }
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    if (showSeconds) {
      return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
    }
    return `${minutes}m`;
  }

  return `${seconds}s`;
}

/**
 * Formats minutes into a human-readable duration string.
 */
export function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  return `${minutes}m`;
}

/**
 * Formats seconds into HH:MM:SS format for timer display.
 */
export function formatTimerDisplay(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Component to display formatted time duration.
 */
export function TimeDisplay({
  seconds,
  minutes,
  className,
  showSeconds = true,
  size = 'md',
}: TimeDisplayProps) {
  const totalSeconds = seconds ?? (minutes ? minutes * 60 : 0);

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base font-medium',
  };

  return (
    <span className={cn('font-mono tabular-nums', sizeClasses[size], className)}>
      {showSeconds ? formatTimerDisplay(totalSeconds) : formatMinutes(Math.floor(totalSeconds / 60))}
    </span>
  );
}
