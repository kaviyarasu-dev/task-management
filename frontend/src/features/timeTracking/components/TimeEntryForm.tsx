import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useCreateTimeEntry } from '../hooks/useTimeTrackingMutations';
import { manualTimeEntrySchema, type ManualTimeEntryFormData } from '../validators/timeEntry.validators';

interface TimeEntryFormProps {
  taskId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function TimeEntryForm({ taskId, onSuccess, onCancel, className }: TimeEntryFormProps) {
  const createEntry = useCreateTimeEntry();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ManualTimeEntryFormData>({
    resolver: zodResolver(manualTimeEntrySchema),
    defaultValues: {
      taskId,
      description: '',
      date: new Date().toISOString().split('T')[0],
      hours: 0,
      minutes: 30,
      billable: false,
    },
  });

  const onSubmit = async (data: ManualTimeEntryFormData) => {
    // Convert manual entry to API format
    const startDate = new Date(data.date);
    startDate.setHours(9, 0, 0, 0); // Default start at 9 AM

    const durationMinutes = data.hours * 60 + data.minutes;
    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

    try {
      await createEntry.mutateAsync({
        taskId: data.taskId,
        description: data.description || undefined,
        startedAt: startDate.toISOString(),
        endedAt: endDate.toISOString(),
        durationMinutes,
        billable: data.billable,
      });

      reset();
      onSuccess?.();
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">Add Time Entry</h4>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded p-1 hover:bg-muted"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      <input type="hidden" {...register('taskId')} />

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-foreground">
          Description
        </label>
        <input
          id="description"
          type="text"
          placeholder="What did you work on?"
          {...register('description')}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Date */}
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-foreground">
          Date
        </label>
        <input
          id="date"
          type="date"
          {...register('date')}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {errors.date && (
          <p className="mt-1 text-sm text-destructive">{errors.date.message}</p>
        )}
      </div>

      {/* Duration */}
      <div>
        <label className="block text-sm font-medium text-foreground">Duration</label>
        <div className="mt-1 flex items-center gap-2">
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={0}
              max={24}
              {...register('hours', { valueAsNumber: true })}
              className="w-16 rounded-md border border-border bg-background px-2 py-2 text-sm text-center focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <span className="text-sm text-muted-foreground">h</span>
          </div>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={0}
              max={59}
              {...register('minutes', { valueAsNumber: true })}
              className="w-16 rounded-md border border-border bg-background px-2 py-2 text-sm text-center focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <span className="text-sm text-muted-foreground">m</span>
          </div>
        </div>
        {errors.hours && (
          <p className="mt-1 text-sm text-destructive">{errors.hours.message}</p>
        )}
      </div>

      {/* Billable */}
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          {...register('billable')}
          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
        />
        <span className="text-sm text-foreground">Billable time</span>
      </label>

      {/* Submit */}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || createEntry.isPending}
          className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {(isSubmitting || createEntry.isPending) && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          Add Entry
        </button>
      </div>

      {createEntry.isError && (
        <p className="text-sm text-destructive">Failed to create time entry. Please try again.</p>
      )}
    </form>
  );
}
