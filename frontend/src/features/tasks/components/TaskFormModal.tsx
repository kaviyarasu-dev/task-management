import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2, RefreshCw } from 'lucide-react';
import type { Task } from '@/shared/types/entities.types';
import type { Project } from '@/shared/types/entities.types';
import type { TaskPriority } from '@/shared/types/api.types';
import { useStatuses, useDefaultStatus } from '@/features/statuses';
import { useMembers } from '@/features/users';
import { createTaskSchema, type CreateTaskFormData } from '../validators/task.validators';
import { cn } from '@/shared/lib/utils';
import { UserSelect } from '@/shared/components/UserSelect';
import { RecurrenceSelect } from './RecurrenceSelect';
import { RecurrencePreview } from './RecurrencePreview';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTaskFormData) => void;
  task: Task | null;
  projects: Project[];
  isLoading?: boolean;
  initialStatusId?: string; // For creating task in a specific column
}

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export function TaskFormModal({
  isOpen,
  onClose,
  onSubmit,
  task,
  projects,
  isLoading = false,
  initialStatusId,
}: TaskFormModalProps) {
  const statuses = useStatuses();
  const defaultStatus = useDefaultStatus();
  const { data: membersData } = useMembers();
  const members = membersData?.data ?? [];
  const [showRecurrence, setShowRecurrence] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateTaskFormData>({
    resolver: zodResolver(createTaskSchema),
  });

  // Reset form when modal opens/closes or task changes
  useEffect(() => {
    if (isOpen) {
      if (task) {
        const taskStatusId = typeof task.status === 'object' && task.status !== null
          ? task.status._id
          : task.statusId;

        const hasRecurrence = !!task.recurrence;
        setShowRecurrence(hasRecurrence);

        reset({
          title: task.title,
          description: task.description ?? '',
          projectId: task.projectId,
          statusId: taskStatusId,
          priority: task.priority,
          dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
          tags: task.tags.join(', '),
          assigneeId: task.assigneeId ?? null,
          recurrence: task.recurrence ?? null,
        });
      } else {
        setShowRecurrence(false);
        reset({
          title: '',
          description: '',
          projectId: projects[0]?._id ?? '',
          statusId: initialStatusId ?? defaultStatus?._id ?? '',
          priority: 'medium',
          dueDate: '',
          tags: '',
          assigneeId: null,
          recurrence: null,
        });
      }
    }
  }, [isOpen, task, projects, reset, initialStatusId, defaultStatus]);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg rounded-lg border border-border bg-background p-6 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {task ? 'Edit Task' : 'Create Task'}
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-muted"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-foreground">
              Title *
            </label>
            <input
              id="title"
              type="text"
              {...register('title')}
              className={cn(
                'mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm',
                'focus:outline-none focus:ring-2 focus:ring-primary/50',
                errors.title && 'border-destructive'
              )}
              placeholder="Enter task title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-foreground">
              Description
            </label>
            <textarea
              id="description"
              {...register('description')}
              rows={3}
              className={cn(
                'mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm',
                'focus:outline-none focus:ring-2 focus:ring-primary/50'
              )}
              placeholder="Enter task description"
            />
          </div>

          {/* Project & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="projectId" className="block text-sm font-medium text-foreground">
                Project *
              </label>
              <select
                id="projectId"
                {...register('projectId')}
                className={cn(
                  'mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-primary/50',
                  errors.projectId && 'border-destructive'
                )}
              >
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>
              {errors.projectId && (
                <p className="mt-1 text-sm text-destructive">{errors.projectId.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="statusId" className="block text-sm font-medium text-foreground">
                Status
              </label>
              <select
                id="statusId"
                {...register('statusId')}
                className={cn(
                  'mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-primary/50'
                )}
              >
                {statuses.map((status) => (
                  <option key={status._id} value={status._id}>
                    {status.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority & Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-foreground">
                Priority
              </label>
              <select
                id="priority"
                {...register('priority')}
                className={cn(
                  'mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-primary/50'
                )}
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-foreground">
                Due Date
              </label>
              <input
                id="dueDate"
                type="date"
                {...register('dueDate')}
                className={cn(
                  'mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-primary/50'
                )}
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-foreground">
              Tags
            </label>
            <input
              id="tags"
              type="text"
              {...register('tags')}
              className={cn(
                'mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm',
                'focus:outline-none focus:ring-2 focus:ring-primary/50'
              )}
              placeholder="Enter tags separated by commas"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Separate multiple tags with commas
            </p>
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-sm font-medium text-foreground">Assignee</label>
            <Controller
              name="assigneeId"
              control={control}
              render={({ field }) => (
                <UserSelect
                  users={members}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Unassigned"
                  allowClear
                  className="mt-1"
                />
              )}
            />
          </div>

          {/* Recurrence */}
          <div className="border-t border-border pt-4">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={showRecurrence}
                onChange={(e) => {
                  setShowRecurrence(e.target.checked);
                  if (!e.target.checked) {
                    // Clear recurrence when toggled off
                    const currentValues = control._formValues;
                    reset({ ...currentValues, recurrence: null });
                  }
                }}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary/50"
              />
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Repeat task</span>
            </label>

            {showRecurrence && (
              <div className="mt-3 space-y-3">
                <Controller
                  name="recurrence"
                  control={control}
                  render={({ field }) => (
                    <RecurrenceSelect
                      value={field.value ?? null}
                      onChange={(pattern) => field.onChange(pattern)}
                    />
                  )}
                />

                {/* Preview next occurrences */}
                <Controller
                  name="recurrence"
                  control={control}
                  render={({ field }) =>
                    field.value ? (
                      <RecurrencePreview
                        pattern={field.value}
                        count={3}
                        className="rounded-md border border-border bg-muted/30 p-3"
                      />
                    ) : null
                  }
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {task ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
