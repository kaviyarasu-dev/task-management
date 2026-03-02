import { cn } from '@/shared/lib/utils';
import type { Task } from '@/shared/types/entities.types';
import type { TaskPriority } from '@/shared/types/api.types';

interface CalendarTaskProps {
  task: Task;
  onClick: () => void;
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'bg-slate-100 text-slate-700 border-slate-200',
  medium: 'bg-blue-100 text-blue-700 border-blue-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  urgent: 'bg-red-100 text-red-700 border-red-200',
};

export function CalendarTask({ task, onClick }: CalendarTaskProps) {
  const isClosedStatus =
    typeof task.status === 'object' && task.status !== null
      ? task.status.category === 'closed'
      : false;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full truncate rounded border px-1.5 py-0.5 text-left text-xs font-medium transition-colors',
        'hover:opacity-80 focus:outline-none focus:ring-1 focus:ring-primary',
        PRIORITY_COLORS[task.priority],
        isClosedStatus && 'line-through opacity-60'
      )}
      title={task.title}
    >
      {task.title}
    </button>
  );
}
