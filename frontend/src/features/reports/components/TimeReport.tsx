import { useMemo } from 'react';
import { Loader2, Clock } from 'lucide-react';
import { useTimeEntries, formatMinutes } from '@/features/timeTracking';
import { useReportFilters } from '../stores/reportFiltersStore';
import { ExportButton } from './ExportButton';
import { generateCsvContent, downloadCsv } from '../utils/exportCsv';
import type { CsvColumn, TimeSummaryRow } from '../types/report.types';

const TIME_COLUMNS: CsvColumn<TimeSummaryRow>[] = [
  { header: 'User', accessor: 'userName' },
  {
    header: 'Total Time',
    accessor: (row) => {
      const hours = Math.floor(row.totalMinutes / 60);
      const mins = row.totalMinutes % 60;
      return `${hours}h ${mins}m`;
    },
  },
  {
    header: 'Billable Time',
    accessor: (row) => {
      const hours = Math.floor(row.billableMinutes / 60);
      const mins = row.billableMinutes % 60;
      return `${hours}h ${mins}m`;
    },
  },
  { header: 'Task Count', accessor: 'taskCount' },
];

interface UserTimeSummary {
  userId: string;
  userName: string;
  totalMinutes: number;
  billableMinutes: number;
  taskIds: Set<string>;
}

export function TimeReport() {
  const filters = useReportFilters();
  const { data, isLoading, error } = useTimeEntries({
    startedAfter: filters.dateRange.start,
    startedBefore: filters.dateRange.end,
    userId: filters.userId,
  });

  const timeEntries = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) ?? [];
  }, [data]);

  const reportData = useMemo<TimeSummaryRow[]>(() => {
    if (!timeEntries.length) return [];

    // Group by user
    const userMap = new Map<string, UserTimeSummary>();

    timeEntries.forEach((entry) => {
      const existing = userMap.get(entry.userId);
      const minutes = entry.durationMinutes ?? 0;

      if (existing) {
        existing.totalMinutes += minutes;
        if (entry.billable) {
          existing.billableMinutes += minutes;
        }
        existing.taskIds.add(entry.taskId);
      } else {
        userMap.set(entry.userId, {
          userId: entry.userId,
          userName: entry.userId, // Will be replaced with actual name if available
          totalMinutes: minutes,
          billableMinutes: entry.billable ? minutes : 0,
          taskIds: new Set([entry.taskId]),
        });
      }
    });

    return Array.from(userMap.values()).map((user) => ({
      userId: user.userId,
      userName: user.userName,
      totalMinutes: user.totalMinutes,
      billableMinutes: user.billableMinutes,
      taskCount: user.taskIds.size,
    }));
  }, [timeEntries]);

  const handleExport = () => {
    const csv = generateCsvContent(reportData, TIME_COLUMNS);
    downloadCsv(csv, 'time-summary');
  };

  // Calculate totals
  const totalMinutes = reportData.reduce((sum, r) => sum + r.totalMinutes, 0);
  const billableMinutes = reportData.reduce((sum, r) => sum + r.billableMinutes, 0);
  const totalTasks = new Set(timeEntries.map((e) => e.taskId)).size;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
        <p className="text-destructive">Failed to load time tracking data</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ExportButton onClick={handleExport} disabled={reportData.length === 0} />
      </div>

      {reportData.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">
            No time entries found for selected period
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try adjusting the date range or filters
          </p>
        </div>
      ) : (
        <div className="overflow-auto rounded-lg border border-border bg-background">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-sm text-muted-foreground">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Total Time</th>
                <th className="px-4 py-3 font-medium">Billable Time</th>
                <th className="px-4 py-3 font-medium">Tasks</th>
                <th className="px-4 py-3 font-medium">Billable %</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((row) => {
                const billablePercentage =
                  row.totalMinutes > 0
                    ? (row.billableMinutes / row.totalMinutes) * 100
                    : 0;

                return (
                  <tr key={row.userId} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{row.userName}</p>
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {formatMinutes(row.totalMinutes)}
                    </td>
                    <td className="px-4 py-3 text-green-600">
                      {formatMinutes(row.billableMinutes)}
                    </td>
                    <td className="px-4 py-3 text-foreground">{row.taskCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-green-500 transition-all"
                            style={{ width: `${billablePercentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-foreground">
                          {billablePercentage.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      {reportData.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-border bg-background p-4">
            <p className="text-sm text-muted-foreground">Total Time</p>
            <p className="text-2xl font-bold text-foreground">
              {formatMinutes(totalMinutes)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-background p-4">
            <p className="text-sm text-muted-foreground">Billable Time</p>
            <p className="text-2xl font-bold text-green-600">
              {formatMinutes(billableMinutes)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-background p-4">
            <p className="text-sm text-muted-foreground">Tasks Tracked</p>
            <p className="text-2xl font-bold text-foreground">{totalTasks}</p>
          </div>
          <div className="rounded-lg border border-border bg-background p-4">
            <p className="text-sm text-muted-foreground">Billable %</p>
            <p className="text-2xl font-bold text-foreground">
              {totalMinutes > 0
                ? ((billableMinutes / totalMinutes) * 100).toFixed(1)
                : 0}
              %
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
