import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import type { StatusCount } from '../types/analytics.types';

interface TaskStatusChartProps {
  data: StatusCount[];
  isLoading?: boolean;
}

export function TaskStatusChart({ data, isLoading }: TaskStatusChartProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-background p-4">
        <div className="mb-4 h-5 w-32 animate-pulse rounded bg-muted" />
        <div className="flex h-[300px] items-center justify-center">
          <div className="h-40 w-40 animate-pulse rounded-full bg-muted" />
        </div>
      </div>
    );
  }

  const hasData = data.length > 0 && data.some((item) => item.count > 0);

  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <h3 className="font-medium text-foreground">Tasks by Status</h3>
      {!hasData ? (
        <div className="flex h-[300px] items-center justify-center text-muted-foreground">
          No task data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={60}
              paddingAngle={2}
              label={({ name, percent }: { name: string; percent: number }) =>
                `${name} (${(percent * 100).toFixed(0)}%)`
              }
              labelLine={false}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.statusId}
                  fill={entry.color || '#6b7280'}
                  stroke="transparent"
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [value, 'Tasks']}
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem',
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value: string) => (
                <span className="text-sm text-foreground">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
