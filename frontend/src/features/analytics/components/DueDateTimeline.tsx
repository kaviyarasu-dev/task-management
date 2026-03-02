import { Calendar, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface DueTask {
  _id: string;
  title: string;
  dueDate: string;
  priority: string;
  projectName?: string;
}

interface DueDateTimelineProps {
  tasks: DueTask[];
  isLoading?: boolean;
}

function getDaysUntilDue(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function formatDueDate(dueDate: string): string {
  const days = getDaysUntilDue(dueDate);
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) > 1 ? 's' : ''} overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days <= 7) return `Due in ${days} days`;
  return new Date(dueDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'urgent':
      return 'border-red-500';
    case 'high':
      return 'border-orange-500';
    case 'medium':
      return 'border-yellow-500';
    case 'low':
      return 'border-green-500';
    default:
      return 'border-gray-500';
  }
}

function getUrgencyIcon(dueDate: string) {
  const days = getDaysUntilDue(dueDate);
  if (days < 0) return <AlertTriangle className="h-4 w-4 text-red-500" />;
  if (days === 0) return <AlertTriangle className="h-4 w-4 text-orange-500" />;
  if (days <= 2) return <Clock className="h-4 w-4 text-yellow-500" />;
  return <Calendar className="h-4 w-4 text-muted-foreground" />;
}

export function DueDateTimeline({ tasks, isLoading }: DueDateTimelineProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-background p-4">
        <div className="mb-4 h-5 w-40 animate-pulse rounded bg-muted" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  // Sort by due date
  const sortedTasks = [...tasks].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  const hasData = sortedTasks.length > 0;

  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="flex items-center gap-2">
        <Calendar className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-medium text-foreground">Upcoming Due Dates</h3>
      </div>
      {!hasData ? (
        <div className="flex h-[250px] items-center justify-center text-muted-foreground">
          No upcoming tasks with due dates
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {sortedTasks.slice(0, 8).map((task) => {
            const days = getDaysUntilDue(task.dueDate);
            const isOverdue = days < 0;
            const isUrgent = days <= 2;

            return (
              <div
                key={task._id}
                className={cn(
                  'flex items-start gap-3 rounded-md border-l-4 bg-muted/30 p-3',
                  getPriorityColor(task.priority),
                  isOverdue && 'bg-red-500/10'
                )}
              >
                <div className="mt-0.5">{getUrgencyIcon(task.dueDate)}</div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium text-foreground">{task.title}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span
                      className={cn(
                        isOverdue && 'text-red-500 font-medium',
                        isUrgent && !isOverdue && 'text-orange-500'
                      )}
                    >
                      {formatDueDate(task.dueDate)}
                    </span>
                    {task.projectName && (
                      <>
                        <span>·</span>
                        <span className="truncate">{task.projectName}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
