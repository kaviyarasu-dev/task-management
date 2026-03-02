import { useEffect, useState, useMemo } from 'react';
import { X, Calendar, Tag, User, Edit, MessageSquare, History, Clock, Plus, RefreshCw } from 'lucide-react';
import type { Task } from '@/shared/types/entities.types';
import { TaskStatusBadge } from './TaskStatusBadge';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import { formatDate, cn } from '@/shared/lib/utils';
import { UserAvatar } from '@/shared/components/UserAvatar';
import { CommentList } from '@/features/comments';
import { ActivityList, useTaskActivities, useTaskActivityRealtime } from '@/features/activity';
import { TimeTracker, TimeEntryList, TimeEntryForm } from '@/features/timeTracking';
import { RecurrenceDisplay } from './RecurrenceDisplay';
import { RecurrencePreview } from './RecurrencePreview';

type DetailTab = 'comments' | 'activity' | 'time';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (task: Task) => void;
}

export function TaskDetailModal({
  task,
  isOpen,
  onClose,
  onEdit,
}: TaskDetailModalProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>('comments');
  const [showTimeEntryForm, setShowTimeEntryForm] = useState(false);

  // Fetch task activities
  const { data: activitiesData, isLoading: isLoadingActivities } = useTaskActivities(
    task?._id ?? '',
    { enabled: isOpen && !!task?._id, limit: 20 }
  );

  // Enable real-time activity updates
  useTaskActivityRealtime(task?._id ?? '');

  // Flatten activities from paginated response
  const activities = useMemo(() => {
    return activitiesData?.pages.flatMap((page) => page.data) ?? [];
  }, [activitiesData]);

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

  // Reset tab when modal closes
  useEffect(() => {
    if (!isOpen) {
      setActiveTab('comments');
      setShowTimeEntryForm(false);
    }
  }, [isOpen]);

  if (!isOpen || !task) return null;

  // Check if task status is in the "closed" category (e.g., done, cancelled)
  const isClosedStatus = typeof task.status === 'object' && task.status !== null
    ? task.status.category === 'closed'
    : false;

  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && !isClosedStatus;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg border border-border bg-background p-6 shadow-lg">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-8">
            <h2 className="text-lg font-semibold text-foreground">{task.title}</h2>
            <div className="mt-2 flex items-center gap-2">
              <TaskStatusBadge status={task.status} />
              <TaskPriorityBadge priority={task.priority} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(task)}
              className="rounded p-1 hover:bg-muted"
              title="Edit task"
            >
              <Edit className="h-5 w-5 text-muted-foreground" />
            </button>
            <button
              onClick={onClose}
              className="rounded p-1 hover:bg-muted"
              aria-label="Close modal"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-foreground">Description</h3>
            <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
              {task.description}
            </p>
          </div>
        )}

        {/* Details */}
        <div className="mt-6 space-y-3">
          {/* Due Date */}
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Due Date:</span>
            {task.dueDate ? (
              <span
                className={`text-sm ${isOverdue ? 'text-destructive' : 'text-foreground'}`}
              >
                {formatDate(task.dueDate)}
                {isOverdue && ' (Overdue)'}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">Not set</span>
            )}
          </div>

          {/* Assignee */}
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Assignee:</span>
            {task.assignee ? (
              <div className="flex items-center gap-2">
                <UserAvatar
                  firstName={task.assignee.firstName}
                  lastName={task.assignee.lastName}
                  size="sm"
                />
                <span className="text-sm text-foreground">
                  {task.assignee.firstName} {task.assignee.lastName}
                </span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Unassigned</span>
            )}
          </div>

          {/* Tags */}
          {task.tags.length > 0 && (
            <div className="flex items-start gap-3">
              <Tag className="h-4 w-4 text-muted-foreground mt-0.5" />
              <span className="text-sm text-muted-foreground">Tags:</span>
              <div className="flex flex-wrap gap-1">
                {task.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recurrence */}
          {task.recurrence && (
            <div className="flex items-start gap-3">
              <RefreshCw className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Repeats:</span>
                  <RecurrenceDisplay
                    pattern={task.recurrence}
                    showIcon={false}
                    className="text-foreground"
                  />
                </div>
                <RecurrencePreview
                  pattern={task.recurrence}
                  count={3}
                  className="text-muted-foreground"
                />
              </div>
            </div>
          )}
        </div>

        {/* Comments & Activity Section */}
        <div className="mt-6 border-t border-border pt-6">
          {/* Tab Navigation */}
          <div className="mb-4 flex gap-4 border-b border-border">
            <button
              onClick={() => setActiveTab('comments')}
              className={cn(
                'flex items-center gap-2 border-b-2 pb-2 text-sm font-medium transition-colors',
                activeTab === 'comments'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <MessageSquare className="h-4 w-4" />
              Comments
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={cn(
                'flex items-center gap-2 border-b-2 pb-2 text-sm font-medium transition-colors',
                activeTab === 'activity'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <History className="h-4 w-4" />
              Activity
            </button>
            <button
              onClick={() => setActiveTab('time')}
              className={cn(
                'flex items-center gap-2 border-b-2 pb-2 text-sm font-medium transition-colors',
                activeTab === 'time'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <Clock className="h-4 w-4" />
              Time
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'comments' && <CommentList taskId={task._id} />}
          {activeTab === 'activity' && (
            <ActivityList
              activities={activities}
              isLoading={isLoadingActivities}
              emptyMessage="No activity for this task yet"
              compact
            />
          )}
          {activeTab === 'time' && (
            <div className="space-y-4">
              {/* Timer Controls */}
              <TimeTracker taskId={task._id} />

              {/* Add Manual Entry Toggle */}
              {!showTimeEntryForm && (
                <button
                  onClick={() => setShowTimeEntryForm(true)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Plus className="h-4 w-4" />
                  Add manual entry
                </button>
              )}

              {/* Manual Entry Form */}
              {showTimeEntryForm && (
                <TimeEntryForm
                  taskId={task._id}
                  onSuccess={() => setShowTimeEntryForm(false)}
                  onCancel={() => setShowTimeEntryForm(false)}
                />
              )}

              {/* Time Entry History */}
              <div className="border-t border-border pt-4">
                <h4 className="mb-3 text-sm font-medium text-foreground">Time Entries</h4>
                <TimeEntryList taskId={task._id} showTotal />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-between border-t border-border pt-4 text-xs text-muted-foreground">
          <span>Created: {formatDate(task.createdAt)}</span>
          <span>Updated: {formatDate(task.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
}
