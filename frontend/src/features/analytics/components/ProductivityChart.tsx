import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { UserProductivity } from '../types/analytics.types';

interface ProductivityChartProps {
  data: UserProductivity[];
  isLoading?: boolean;
}

export function ProductivityChart({ data, isLoading }: ProductivityChartProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-background p-4">
        <div className="mb-4 h-5 w-44 animate-pulse rounded bg-muted" />
        <div className="h-[350px] animate-pulse rounded bg-muted" />
      </div>
    );
  }

  const hasData = data.length > 0;

  // Format data for the chart
  const chartData = data.map((user) => ({
    name: user.userName.trim() || user.userEmail.split('@')[0],
    completed: user.completedTasks,
    pending: user.totalTasks - user.completedTasks,
    overdue: user.overdueTasks,
    onTimeRate: user.onTimePercentage,
  }));

  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <h3 className="font-medium text-foreground">Team Productivity</h3>
      {!hasData ? (
        <div className="flex h-[350px] items-center justify-center text-muted-foreground">
          No productivity data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 80, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              horizontal
              vertical={false}
            />
            <XAxis
              type="number"
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              width={80}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value: number, name: string) => {
                if (name === 'onTimeRate') return [`${value}%`, 'On-Time Rate'];
                return [value, name.charAt(0).toUpperCase() + name.slice(1)];
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value: string) => (
                <span className="text-sm text-foreground">
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </span>
              )}
            />
            <Bar
              dataKey="completed"
              name="Completed"
              fill="#22c55e"
              stackId="tasks"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="pending"
              name="Pending"
              fill="#3b82f6"
              stackId="tasks"
              radius={[0, 4, 4, 0]}
            />
            <Bar
              dataKey="overdue"
              name="Overdue"
              fill="#ef4444"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
