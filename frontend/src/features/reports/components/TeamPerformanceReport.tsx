import { useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { useUserProductivity } from '@/features/analytics';
import { useReportFilters } from '../stores/reportFiltersStore';
import { ExportButton } from './ExportButton';
import { generateCsvContent, downloadCsv } from '../utils/exportCsv';
import type { CsvColumn, TeamPerformanceRow } from '../types/report.types';

const TEAM_COLUMNS: CsvColumn<TeamPerformanceRow>[] = [
  { header: 'Name', accessor: 'userName' },
  { header: 'Email', accessor: 'email' },
  { header: 'Total Tasks', accessor: 'totalTasks' },
  { header: 'Completed', accessor: 'completedTasks' },
  { header: 'Overdue', accessor: 'overdueTasks' },
  { header: 'On-Time %', accessor: (row) => `${row.onTimePercentage.toFixed(1)}%` },
  { header: 'Completion Rate', accessor: (row) => `${row.completionRate.toFixed(1)}%` },
];

export function TeamPerformanceReport() {
  const filters = useReportFilters();
  const { data, isLoading, error } = useUserProductivity({
    start: filters.dateRange.start,
    end: filters.dateRange.end,
  });

  const reportData = useMemo<TeamPerformanceRow[]>(() => {
    if (!data) return [];
    return data
      .filter((user) => !filters.userId || user.userId === filters.userId)
      .map((user) => ({
        userId: user.userId,
        userName: user.userName || user.userEmail.split('@')[0],
        email: user.userEmail,
        completedTasks: user.completedTasks,
        totalTasks: user.totalTasks,
        overdueTasks: user.overdueTasks,
        onTimePercentage: user.onTimePercentage,
        completionRate:
          user.totalTasks > 0 ? (user.completedTasks / user.totalTasks) * 100 : 0,
      }));
  }, [data, filters.userId]);

  const handleExport = () => {
    const csv = generateCsvContent(reportData, TEAM_COLUMNS);
    downloadCsv(csv, 'team-performance');
  };

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
        <p className="text-destructive">Failed to load team performance data</p>
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
          <p className="text-muted-foreground">No team data for selected period</p>
        </div>
      ) : (
        <div className="overflow-auto rounded-lg border border-border bg-background">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-sm text-muted-foreground">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Total Tasks</th>
                <th className="px-4 py-3 font-medium">Completed</th>
                <th className="px-4 py-3 font-medium">Overdue</th>
                <th className="px-4 py-3 font-medium">On-Time %</th>
                <th className="px-4 py-3 font-medium">Completion Rate</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((row) => (
                <tr key={row.userId} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-foreground">{row.userName}</p>
                      <p className="text-sm text-muted-foreground">{row.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-foreground">{row.totalTasks}</td>
                  <td className="px-4 py-3 text-green-600">{row.completedTasks}</td>
                  <td className="px-4 py-3 text-red-600">{row.overdueTasks}</td>
                  <td className="px-4 py-3 text-foreground">
                    {row.onTimePercentage.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${Math.min(row.completionRate, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm text-foreground">
                        {row.completionRate.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      {reportData.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-border bg-background p-4">
            <p className="text-sm text-muted-foreground">Total Team Members</p>
            <p className="text-2xl font-bold text-foreground">{reportData.length}</p>
          </div>
          <div className="rounded-lg border border-border bg-background p-4">
            <p className="text-sm text-muted-foreground">Total Tasks</p>
            <p className="text-2xl font-bold text-foreground">
              {reportData.reduce((sum, r) => sum + r.totalTasks, 0)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-background p-4">
            <p className="text-sm text-muted-foreground">Total Completed</p>
            <p className="text-2xl font-bold text-green-600">
              {reportData.reduce((sum, r) => sum + r.completedTasks, 0)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-background p-4">
            <p className="text-sm text-muted-foreground">Avg Completion Rate</p>
            <p className="text-2xl font-bold text-foreground">
              {(
                reportData.reduce((sum, r) => sum + r.completionRate, 0) / reportData.length
              ).toFixed(1)}
              %
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
