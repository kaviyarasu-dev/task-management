import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { VelocityDataPoint, VelocityPeriod } from '../types/analytics.types';

interface TaskTrendChartProps {
  data: VelocityDataPoint[];
  period?: VelocityPeriod;
  averageVelocity?: number;
  isLoading?: boolean;
}

function formatDate(dateStr: string, period: VelocityPeriod): string {
  if (period === 'weekly' && dateStr.includes('W')) {
    return dateStr; // Already formatted as YYYY-Wxx
  }
  if (period === 'monthly') {
    const [year, month] = dateStr.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month, 10) - 1]} ${year.slice(2)}`;
  }
  // Daily format
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function TaskTrendChart({
  data,
  period = 'weekly',
  averageVelocity,
  isLoading,
}: TaskTrendChartProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-background p-4">
        <div className="mb-4 h-5 w-40 animate-pulse rounded bg-muted" />
        <div className="h-[300px] animate-pulse rounded bg-muted" />
      </div>
    );
  }

  const hasData = data.length > 0;
  const formattedData = data.map((point) => ({
    ...point,
    formattedDate: formatDate(point.date, period),
  }));

  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-foreground">Task Velocity</h3>
        {averageVelocity !== undefined && (
          <span className="text-sm text-muted-foreground">
            Avg: {averageVelocity.toFixed(1)} completed/{period.replace('ly', '')}
          </span>
        )}
      </div>
      {!hasData ? (
        <div className="flex h-[300px] items-center justify-center text-muted-foreground">
          No velocity data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={formattedData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey="formattedDate"
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
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value: string) => (
                <span className="text-sm text-foreground">{value}</span>
              )}
            />
            <Line
              type="monotone"
              dataKey="created"
              name="Created"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
            <Line
              type="monotone"
              dataKey="completed"
              name="Completed"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ fill: '#22c55e', strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
