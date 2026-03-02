import { CalendarView } from '@/features/calendar';

export function CalendarPage() {
  return (
    <div className="flex h-full flex-col">
      <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
      <div className="mt-4 flex-1">
        <CalendarView />
      </div>
    </div>
  );
}
