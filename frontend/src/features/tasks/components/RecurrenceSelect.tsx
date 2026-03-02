import { useState } from 'react';
import { ChevronDown, Settings } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type {
  RecurrencePattern,
  DayOfWeek,
  RecurrenceEndType,
} from '../types/recurrence.types';
import {
  RECURRENCE_PRESETS,
  DAY_OF_WEEK_SHORT_NAMES,
} from '../types/recurrence.types';

interface RecurrenceSelectProps {
  value: RecurrencePattern | null;
  onChange: (pattern: RecurrencePattern | null) => void;
  className?: string;
}

const ALL_DAYS: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6];

export function RecurrenceSelect({ value, onChange, className }: RecurrenceSelectProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [endType, setEndType] = useState<RecurrenceEndType>(
    value?.endDate ? 'on_date' : value?.endAfterCount ? 'after_count' : 'never'
  );

  // Find matching preset or show custom
  const matchingPreset = RECURRENCE_PRESETS.find(
    (preset) =>
      preset.pattern.type === value?.type &&
      preset.pattern.interval === value?.interval &&
      JSON.stringify(preset.pattern.daysOfWeek?.sort()) ===
        JSON.stringify(value?.daysOfWeek?.sort())
  );

  const handlePresetChange = (presetIndex: string) => {
    if (presetIndex === 'custom') {
      setShowCustom(true);
      // Default to daily if no current value
      if (!value) {
        onChange({ type: 'daily', interval: 1 });
      }
    } else if (presetIndex === '') {
      onChange(null);
      setShowCustom(false);
    } else {
      const preset = RECURRENCE_PRESETS[parseInt(presetIndex, 10)];
      onChange(preset.pattern);
      setShowCustom(false);
    }
  };

  const handleTypeChange = (type: RecurrencePattern['type']) => {
    const basePattern: RecurrencePattern = {
      type,
      interval: value?.interval ?? 1,
    };

    if (type === 'weekly') {
      // Default to current day of week
      const today = new Date().getDay() as DayOfWeek;
      basePattern.daysOfWeek = [today];
    } else if (type === 'monthly') {
      basePattern.dayOfMonth = value?.dayOfMonth ?? new Date().getDate();
    }

    // Preserve end conditions
    if (endType === 'on_date' && value?.endDate) {
      basePattern.endDate = value.endDate;
    } else if (endType === 'after_count' && value?.endAfterCount) {
      basePattern.endAfterCount = value.endAfterCount;
    }

    onChange(basePattern);
  };

  const handleIntervalChange = (interval: number) => {
    if (!value) return;
    onChange({ ...value, interval });
  };

  const handleDayToggle = (day: DayOfWeek) => {
    if (!value || value.type !== 'weekly') return;

    const currentDays = value.daysOfWeek ?? [];
    const isSelected = currentDays.includes(day);

    let newDays: DayOfWeek[];
    if (isSelected) {
      // Don't allow deselecting the last day
      if (currentDays.length === 1) return;
      newDays = currentDays.filter((d) => d !== day);
    } else {
      newDays = [...currentDays, day].sort((a, b) => a - b);
    }

    onChange({ ...value, daysOfWeek: newDays });
  };

  const handleDayOfMonthChange = (day: number) => {
    if (!value || value.type !== 'monthly') return;
    onChange({ ...value, dayOfMonth: day });
  };

  const handleEndTypeChange = (type: RecurrenceEndType) => {
    setEndType(type);
    if (!value) return;

    const newPattern = { ...value };
    delete newPattern.endDate;
    delete newPattern.endAfterCount;

    onChange(newPattern);
  };

  const handleEndDateChange = (date: string) => {
    if (!value) return;
    onChange({ ...value, endDate: date, endAfterCount: undefined });
  };

  const handleEndAfterCountChange = (count: number) => {
    if (!value) return;
    onChange({ ...value, endAfterCount: count, endDate: undefined });
  };

  // Get current preset index or 'custom'
  const currentPresetValue = (() => {
    if (!value) return '';
    if (showCustom) return 'custom';
    const index = RECURRENCE_PRESETS.findIndex(
      (preset) =>
        preset.pattern.type === value.type &&
        preset.pattern.interval === value.interval &&
        JSON.stringify(preset.pattern.daysOfWeek?.sort()) ===
          JSON.stringify(value.daysOfWeek?.sort())
    );
    return index >= 0 ? index.toString() : 'custom';
  })();

  return (
    <div className={cn('space-y-3', className)}>
      {/* Preset Dropdown */}
      <div className="relative">
        <select
          value={currentPresetValue}
          onChange={(e) => handlePresetChange(e.target.value)}
          className={cn(
            'w-full appearance-none rounded-md border border-border bg-background px-3 py-2 pr-10 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-primary/50'
          )}
        >
          <option value="">No recurrence</option>
          {RECURRENCE_PRESETS.map((preset, index) => (
            <option key={index} value={index.toString()}>
              {preset.label}
            </option>
          ))}
          <option value="custom">Custom...</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>

      {/* Custom Configuration */}
      {(showCustom || (value && !matchingPreset)) && value && (
        <div className="space-y-3 rounded-md border border-border bg-muted/30 p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Settings className="h-3 w-3" />
            Custom recurrence
          </div>

          {/* Type & Interval */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground">Every</span>
            <input
              type="number"
              min={1}
              max={365}
              value={value.interval}
              onChange={(e) => handleIntervalChange(parseInt(e.target.value, 10) || 1)}
              className={cn(
                'w-16 rounded-md border border-border bg-background px-2 py-1 text-center text-sm',
                'focus:outline-none focus:ring-2 focus:ring-primary/50'
              )}
            />
            <select
              value={value.type}
              onChange={(e) =>
                handleTypeChange(e.target.value as RecurrencePattern['type'])
              }
              className={cn(
                'rounded-md border border-border bg-background px-3 py-1 text-sm',
                'focus:outline-none focus:ring-2 focus:ring-primary/50'
              )}
            >
              <option value="daily">{value.interval === 1 ? 'day' : 'days'}</option>
              <option value="weekly">{value.interval === 1 ? 'week' : 'weeks'}</option>
              <option value="monthly">{value.interval === 1 ? 'month' : 'months'}</option>
            </select>
          </div>

          {/* Days of Week (for weekly) */}
          {value.type === 'weekly' && (
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground">On these days:</span>
              <div className="flex flex-wrap gap-1">
                {ALL_DAYS.map((day) => {
                  const isSelected = value.daysOfWeek?.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayToggle(day)}
                      className={cn(
                        'rounded px-2 py-1 text-xs font-medium transition-colors',
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      )}
                    >
                      {DAY_OF_WEEK_SHORT_NAMES[day]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Day of Month (for monthly) */}
          {value.type === 'monthly' && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground">On day</span>
              <input
                type="number"
                min={1}
                max={31}
                value={value.dayOfMonth ?? 1}
                onChange={(e) =>
                  handleDayOfMonthChange(parseInt(e.target.value, 10) || 1)
                }
                className={cn(
                  'w-16 rounded-md border border-border bg-background px-2 py-1 text-center text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-primary/50'
                )}
              />
              <span className="text-xs text-muted-foreground">of each month</span>
            </div>
          )}

          {/* End Condition */}
          <div className="space-y-2 border-t border-border pt-3">
            <span className="text-xs text-muted-foreground">Ends:</span>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="endType"
                  checked={endType === 'never'}
                  onChange={() => handleEndTypeChange('never')}
                  className="h-4 w-4 text-primary"
                />
                <span className="text-sm">Never</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="endType"
                  checked={endType === 'on_date'}
                  onChange={() => handleEndTypeChange('on_date')}
                  className="h-4 w-4 text-primary"
                />
                <span className="text-sm">On date</span>
                {endType === 'on_date' && (
                  <input
                    type="date"
                    value={value.endDate ?? ''}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className={cn(
                      'ml-2 rounded-md border border-border bg-background px-2 py-1 text-sm',
                      'focus:outline-none focus:ring-2 focus:ring-primary/50'
                    )}
                  />
                )}
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="endType"
                  checked={endType === 'after_count'}
                  onChange={() => handleEndTypeChange('after_count')}
                  className="h-4 w-4 text-primary"
                />
                <span className="text-sm">After</span>
                {endType === 'after_count' && (
                  <>
                    <input
                      type="number"
                      min={1}
                      max={999}
                      value={value.endAfterCount ?? 10}
                      onChange={(e) =>
                        handleEndAfterCountChange(parseInt(e.target.value, 10) || 1)
                      }
                      className={cn(
                        'w-16 rounded-md border border-border bg-background px-2 py-1 text-center text-sm',
                        'focus:outline-none focus:ring-2 focus:ring-primary/50'
                      )}
                    />
                    <span className="text-sm">occurrences</span>
                  </>
                )}
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
