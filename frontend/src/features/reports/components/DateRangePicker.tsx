import { Calendar } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { DATE_RANGE_PRESETS } from '../types/report.types';
import type { DateRangePreset } from '../types/report.types';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  preset?: DateRangePreset;
  onStartChange: (date: string) => void;
  onEndChange: (date: string) => void;
  onPresetChange: (preset: DateRangePreset) => void;
}

export function DateRangePicker({
  startDate,
  endDate,
  preset,
  onStartChange,
  onEndChange,
  onPresetChange,
}: DateRangePickerProps) {
  const isCustom = preset === 'custom';

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Preset dropdown */}
      <select
        value={preset ?? 'custom'}
        onChange={(e) => onPresetChange(e.target.value as DateRangePreset)}
        className={cn(
          'rounded-md border border-border bg-background px-3 py-2 text-sm',
          'focus:outline-none focus:ring-2 focus:ring-primary/50'
        )}
      >
        {DATE_RANGE_PRESETS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>

      {/* Custom date inputs - only shown when preset is 'custom' */}
      {isCustom && (
        <>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartChange(e.target.value)}
              max={endDate}
              className={cn(
                'rounded-md border border-border bg-background px-3 py-2 text-sm',
                'focus:outline-none focus:ring-2 focus:ring-primary/50'
              )}
            />
          </div>
          <span className="text-muted-foreground">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndChange(e.target.value)}
            min={startDate}
            className={cn(
              'rounded-md border border-border bg-background px-3 py-2 text-sm',
              'focus:outline-none focus:ring-2 focus:ring-primary/50'
            )}
          />
        </>
      )}

      {/* Display date range for non-custom presets */}
      {!isCustom && (
        <span className="text-sm text-muted-foreground">
          {startDate} - {endDate}
        </span>
      )}
    </div>
  );
}
