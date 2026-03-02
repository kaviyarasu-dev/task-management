import { X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { Project, User } from '@/shared/types/entities.types';
import { DateRangePicker } from './DateRangePicker';
import { useReportFiltersStore } from '../stores/reportFiltersStore';

interface ReportFiltersProps {
  projects: Project[];
  users: User[];
}

export function ReportFilters({ projects, users }: ReportFiltersProps) {
  const {
    filters,
    setDateRange,
    setDateRangePreset,
    setProjectId,
    setUserId,
    clearFilters,
  } = useReportFiltersStore();

  const hasFilters =
    filters.projectId || filters.userId || filters.dateRange.preset !== 'last30days';

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-background p-4">
      {/* Date Range */}
      <DateRangePicker
        startDate={filters.dateRange.start}
        endDate={filters.dateRange.end}
        preset={filters.dateRange.preset}
        onStartChange={(date) => setDateRange(date, filters.dateRange.end)}
        onEndChange={(date) => setDateRange(filters.dateRange.start, date)}
        onPresetChange={setDateRangePreset}
      />

      {/* Divider */}
      <div className="h-8 w-px bg-border" />

      {/* Project Filter */}
      <div className="flex items-center gap-2">
        <label htmlFor="project-filter" className="text-sm text-muted-foreground">
          Project:
        </label>
        <select
          id="project-filter"
          value={filters.projectId ?? ''}
          onChange={(e) => setProjectId(e.target.value || undefined)}
          className={cn(
            'rounded-md border border-border bg-background px-3 py-2 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-primary/50'
          )}
        >
          <option value="">All Projects</option>
          {projects.map((project) => (
            <option key={project._id} value={project._id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {/* User Filter */}
      <div className="flex items-center gap-2">
        <label htmlFor="user-filter" className="text-sm text-muted-foreground">
          User:
        </label>
        <select
          id="user-filter"
          value={filters.userId ?? ''}
          onChange={(e) => setUserId(e.target.value || undefined)}
          className={cn(
            'rounded-md border border-border bg-background px-3 py-2 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-primary/50'
          )}
        >
          <option value="">All Users</option>
          {users.map((user) => (
            <option key={user._id} value={user._id}>
              {user.firstName} {user.lastName}
            </option>
          ))}
        </select>
      </div>

      {/* Clear Filters */}
      {hasFilters && (
        <button
          onClick={clearFilters}
          className={cn(
            'flex items-center gap-1 rounded-md px-3 py-2 text-sm',
            'text-muted-foreground hover:text-foreground transition-colors'
          )}
        >
          <X className="h-4 w-4" />
          Clear
        </button>
      )}
    </div>
  );
}
