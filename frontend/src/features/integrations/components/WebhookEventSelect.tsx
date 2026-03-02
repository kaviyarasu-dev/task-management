import { Check } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { WEBHOOK_EVENTS, WEBHOOK_EVENT_CATEGORIES } from '../types/webhook.types';

interface WebhookEventSelectProps {
  value: string[];
  onChange: (events: string[]) => void;
  error?: string;
}

export function WebhookEventSelect({ value, onChange, error }: WebhookEventSelectProps) {
  const toggleEvent = (eventValue: string) => {
    if (value.includes(eventValue)) {
      onChange(value.filter((v) => v !== eventValue));
    } else {
      onChange([...value, eventValue]);
    }
  };

  const toggleCategory = (category: string) => {
    const categoryEvents = WEBHOOK_EVENTS.filter((e) => e.category === category).map(
      (e) => e.value
    );
    const allSelected = categoryEvents.every((e) => value.includes(e));

    if (allSelected) {
      onChange(value.filter((v) => !categoryEvents.includes(v)));
    } else {
      const newValue = new Set([...value, ...categoryEvents]);
      onChange([...newValue]);
    }
  };

  const selectAll = () => {
    onChange(WEBHOOK_EVENTS.map((e) => e.value));
  };

  const clearAll = () => {
    onChange([]);
  };

  // Group events by category
  const eventsByCategory = Object.entries(WEBHOOK_EVENT_CATEGORIES).map(([key, label]) => ({
    category: key,
    label,
    events: WEBHOOK_EVENTS.filter((e) => e.category === key),
  }));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Events</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="text-xs text-primary hover:underline"
          >
            Select all
          </button>
          <span className="text-muted-foreground">|</span>
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-primary hover:underline"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="space-y-4 rounded-md border border-border p-4">
        {eventsByCategory.map(({ category, label, events }) => {
          const categoryEventValues = events.map((e) => e.value);
          const selectedCount = categoryEventValues.filter((e) => value.includes(e)).length;
          const isAllSelected = selectedCount === events.length;
          const isPartialSelected = selectedCount > 0 && !isAllSelected;

          return (
            <div key={category}>
              <label className="flex cursor-pointer items-center gap-2">
                <div
                  className={cn(
                    'flex h-4 w-4 items-center justify-center rounded border',
                    isAllSelected
                      ? 'border-primary bg-primary'
                      : isPartialSelected
                        ? 'border-primary bg-primary/30'
                        : 'border-border'
                  )}
                  onClick={() => toggleCategory(category)}
                >
                  {isAllSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                  {isPartialSelected && (
                    <div className="h-2 w-2 rounded-sm bg-primary" />
                  )}
                </div>
                <span className="text-sm font-medium text-foreground">
                  {label}{' '}
                  <span className="text-muted-foreground">
                    ({selectedCount}/{events.length})
                  </span>
                </span>
              </label>

              <div className="ml-6 mt-2 grid grid-cols-2 gap-2">
                {events.map((event) => {
                  const isSelected = value.includes(event.value);

                  return (
                    <label
                      key={event.value}
                      className="flex cursor-pointer items-center gap-2"
                    >
                      <div
                        className={cn(
                          'flex h-4 w-4 items-center justify-center rounded border',
                          isSelected ? 'border-primary bg-primary' : 'border-border'
                        )}
                        onClick={() => toggleEvent(event.value)}
                      >
                        {isSelected && (
                          <Check className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">{event.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {value.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {value.length} event{value.length !== 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  );
}
