import { useEffect } from 'react';
import { X, Calendar, Plus } from 'lucide-react';
import type { Task } from '@/shared/types/entities.types';
import { TaskPriorityBadge } from '@/features/tasks/components/TaskPriorityBadge';
import { TaskStatusBadge } from '@/features/tasks/components/TaskStatusBadge';
import { UserAvatar } from '@/shared/components/UserAvatar';
import { cn } from '@/shared/lib/utils';

interface DayDetailPanelProps {
  date: Date | null;
  tasks: Task[];
  isOpen: boolean;
  onClose: () => void;
  onTaskClick: (task: Task) => void;
  onCreateTask: (date: Date) => void;
}

export function DayDetailPanel({
  date,
  tasks,
  isOpen,
  onClose,
  onTaskClick,
  onCreateTask,
}: DayDetailPanelProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const formattedDate = date
    ? new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(date)
    : '';

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Panel */}
      <div
        className={cn(
          'fixed right-0 top-0 z-50 h-full w-96 transform border-l border-border bg-background shadow-lg transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold text-foreground">{formattedDate}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-muted"
            aria-label="Close panel"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex h-[calc(100%-65px)] flex-col">
          {/* Task Count */}
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <span className="text-sm text-muted-foreground">
              {tasks.length} task{tasks.length !== 1 ? 's' : ''}
            </span>
            {date && (
              <button
                onClick={() => onCreateTask(date)}
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <Plus className="h-4 w-4" />
                Add task
              </button>
            )}
          </div>

          {/* Task List */}
          <div className="flex-1 overflow-y-auto p-4">
            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-sm text-muted-foreground">
                  No tasks scheduled for this day
                </p>
                {date && (
                  <button
                    onClick={() => onCreateTask(date)}
                    className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Create a task
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <DayDetailTask
                    key={task._id}
                    task={task}
                    onClick={() => onTaskClick(task)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

interface DayDetailTaskProps {
  task: Task;
  onClick: () => void;
}

function DayDetailTask({ task, onClick }: DayDetailTaskProps) {
  const isClosedStatus =
    typeof task.status === 'object' && task.status !== null
      ? task.status.category === 'closed'
      : false;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full rounded-lg border border-border bg-background p-3 text-left transition-colors hover:border-primary/50 hover:bg-muted/50',
        isClosedStatus && 'opacity-60'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            'flex-1 text-sm font-medium text-foreground',
            isClosedStatus && 'line-through'
          )}
        >
          {task.title}
        </span>
        <TaskPriorityBadge priority={task.priority} />
      </div>

      <div className="mt-2 flex items-center gap-2">
        <TaskStatusBadge status={task.status} />
        {task.assignee && (
          <div className="flex items-center gap-1">
            <UserAvatar
              firstName={task.assignee.firstName}
              lastName={task.assignee.lastName}
              size="sm"
            />
            <span className="text-xs text-muted-foreground">
              {task.assignee.firstName}
            </span>
          </div>
        )}
      </div>

      {task.description && (
        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
          {task.description}
        </p>
      )}
    </button>
  );
}
