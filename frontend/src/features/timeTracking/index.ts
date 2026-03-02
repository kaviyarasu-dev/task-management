// Components
export { TimeDisplay, formatDuration, formatMinutes, formatTimerDisplay } from './components/TimeDisplay';
export { TimeTracker } from './components/TimeTracker';
export { TimeEntryForm } from './components/TimeEntryForm';
export { TimeEntryList } from './components/TimeEntryList';
export { TimeSummary } from './components/TimeSummary';

// Hooks
export {
  useTimeEntries,
  useTaskTimeEntries,
  useTimeEntry,
  useWeeklyReport,
  useTaskTimeTotal,
  TIME_ENTRIES_QUERY_KEY,
  TIME_ENTRY_QUERY_KEY,
  ACTIVE_TIMER_QUERY_KEY,
  WEEKLY_REPORT_QUERY_KEY,
  TASK_TIME_TOTAL_QUERY_KEY,
} from './hooks/useTimeEntries';

export {
  useStartTimer,
  useStopTimer,
  useCreateTimeEntry,
  useUpdateTimeEntry,
  useDeleteTimeEntry,
} from './hooks/useTimeTrackingMutations';

export {
  useActiveTimerSync,
  useActiveTimer,
  useIsTaskTimerActive,
} from './hooks/useActiveTimer';

// Store
export {
  useTimerStore,
  useActiveTimer as useActiveTimerEntry,
  useElapsedSeconds,
  useIsTimerRunning,
  useTimerLoading,
  useTimerError,
  useTimerTaskId,
} from './stores/timerStore';

// Types
export type {
  TimeEntry,
  TimeEntryWithTask,
  TimeEntryFilters,
  CreateTimeEntryData,
  UpdateTimeEntryData,
  StartTimerData,
  WeeklyReportEntry,
  WeeklyReport,
  TaskTimeTotal,
} from './types/timeEntry.types';

// Validators
export {
  startTimerSchema,
  createTimeEntrySchema,
  updateTimeEntrySchema,
  manualTimeEntrySchema,
} from './validators/timeEntry.validators';

export type {
  StartTimerFormData,
  CreateTimeEntryFormData,
  UpdateTimeEntryFormData,
  ManualTimeEntryFormData,
} from './validators/timeEntry.validators';
