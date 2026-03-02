import { Filter, X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { ActivityEntityType, ActivityAction } from '../types/activity.types';

interface ActivityFiltersProps {
  selectedEntityType: ActivityEntityType | null;
  selectedAction: ActivityAction | null;
  onEntityTypeChange: (type: ActivityEntityType | null) => void;
  onActionChange: (action: ActivityAction | null) => void;
  className?: string;
}

const entityTypeOptions: { value: ActivityEntityType; label: string }[] = [
  { value: 'task', label: 'Tasks' },
  { value: 'project', label: 'Projects' },
  { value: 'comment', label: 'Comments' },
  { value: 'user', label: 'Users' },
  { value: 'invitation', label: 'Invitations' },
];

const actionGroups: { group: string; actions: { value: ActivityAction; label: string }[] }[] = [
  {
    group: 'Task',
    actions: [
      { value: 'task.created', label: 'Created' },
      { value: 'task.updated', label: 'Updated' },
      { value: 'task.assigned', label: 'Assigned' },
      { value: 'task.completed', label: 'Completed' },
      { value: 'task.deleted', label: 'Deleted' },
    ],
  },
  {
    group: 'Comment',
    actions: [
      { value: 'comment.created', label: 'Added' },
      { value: 'comment.updated', label: 'Edited' },
      { value: 'comment.deleted', label: 'Deleted' },
    ],
  },
  {
    group: 'Project',
    actions: [
      { value: 'project.created', label: 'Created' },
      { value: 'project.updated', label: 'Updated' },
      { value: 'project.deleted', label: 'Deleted' },
    ],
  },
  {
    group: 'Team',
    actions: [
      { value: 'user.invited', label: 'Invited' },
      { value: 'user.removed', label: 'Removed' },
      { value: 'invitation.accepted', label: 'Joined' },
    ],
  },
];

export function ActivityFilters({
  selectedEntityType,
  selectedAction,
  onEntityTypeChange,
  onActionChange,
  className,
}: ActivityFiltersProps) {
  const hasFilters = selectedEntityType !== null || selectedAction !== null;

  const handleClearFilters = () => {
    onEntityTypeChange(null);
    onActionChange(null);
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Filter header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Filter className="h-4 w-4" />
          <span>Filters</span>
        </div>
        {hasFilters && (
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
            Clear all
          </button>
        )}
      </div>

      {/* Entity type filter */}
      <div>
        <label className="text-xs font-medium text-muted-foreground">
          Activity Type
        </label>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {entityTypeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() =>
                onEntityTypeChange(
                  selectedEntityType === option.value ? null : option.value
                )
              }
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                selectedEntityType === option.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Action filter */}
      <div>
        <label className="text-xs font-medium text-muted-foreground">
          Action
        </label>
        <select
          value={selectedAction ?? ''}
          onChange={(e) =>
            onActionChange(
              e.target.value ? (e.target.value as ActivityAction) : null
            )
          }
          className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
        >
          <option value="">All actions</option>
          {actionGroups.map((group) => (
            <optgroup key={group.group} label={group.group}>
              {group.actions.map((action) => (
                <option key={action.value} value={action.value}>
                  {action.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
    </div>
  );
}

/**
 * Simple chip-based filter for inline use
 */
export function ActivityFilterChips({
  selectedEntityType,
  onEntityTypeChange,
  className,
}: Pick<ActivityFiltersProps, 'selectedEntityType' | 'onEntityTypeChange' | 'className'>) {
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      <button
        onClick={() => onEntityTypeChange(null)}
        className={cn(
          'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
          selectedEntityType === null
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
        )}
      >
        All
      </button>
      {entityTypeOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => onEntityTypeChange(option.value)}
          className={cn(
            'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
            selectedEntityType === option.value
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
