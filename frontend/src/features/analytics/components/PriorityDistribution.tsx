import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { PriorityCount } from '../types/analytics.types';
import { PRIORITY_COLORS, PRIORITY_ORDER } from '../types/analytics.types';

interface PriorityDistributionProps {
  data: PriorityCount[];
  isLoading?: boolean;
}

export function PriorityDistribution({ data, isLoading }: PriorityDistributionProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-background p-4">
        <div className="mb-4 h-5 w-36 animate-pulse rounded bg-muted" />
        <div className="h-[200px] animate-pulse rounded bg-muted" />
      </div>
    );
  }

  const hasData = data.length > 0 && data.some((item) => item.count > 0);

  // Sort by priority order and capitalize names
  const chartData = PRIORITY_ORDER
    .map((priority) => {
      const found = data.find((d) => d.priority === priority);
      return {
        priority: priority.charAt(0).toUpperCase() + priority.slice(1),
        count: found?.count ?? 0,
        color: PRIORITY_COLORS[priority],
        originalPriority: priority,
      };
    })
    .filter((item) => item.count > 0 || hasData);

  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <h3 className="font-medium text-foreground">Tasks by Priority</h3>
      {!hasData ? (
        <div className="flex h-[200px] items-center justify-center text-muted-foreground">
          No priority data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey="priority"
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value: number) => [value, 'Tasks']}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {chartData.map((entry) => (
                <Cell key={entry.originalPriority} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
