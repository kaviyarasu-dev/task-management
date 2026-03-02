import { create } from 'zustand';
import {
  type CalendarView,
  addMonths,
  addWeeks,
  startOfDay,
} from '../types/calendar.types';

interface CalendarState {
  currentDate: Date;
  view: CalendarView;
  selectedDate: Date | null;
  setCurrentDate: (date: Date) => void;
  setView: (view: CalendarView) => void;
  setSelectedDate: (date: Date | null) => void;
  goToNext: () => void;
  goToPrev: () => void;
  goToToday: () => void;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  currentDate: startOfDay(new Date()),
  view: 'month',
  selectedDate: null,

  setCurrentDate: (date) => set({ currentDate: startOfDay(date) }),

  setView: (view) => set({ view }),

  setSelectedDate: (date) => set({ selectedDate: date }),

  goToNext: () => {
    const { currentDate, view } = get();
    const newDate = view === 'month'
      ? addMonths(currentDate, 1)
      : addWeeks(currentDate, 1);
    set({ currentDate: newDate });
  },

  goToPrev: () => {
    const { currentDate, view } = get();
    const newDate = view === 'month'
      ? addMonths(currentDate, -1)
      : addWeeks(currentDate, -1);
    set({ currentDate: newDate });
  },

  goToToday: () => set({ currentDate: startOfDay(new Date()) }),
}));

// Selectors
export const useCurrentDate = () =>
  useCalendarStore((state) => state.currentDate);

export const useCalendarView = () =>
  useCalendarStore((state) => state.view);

export const useSelectedDate = () =>
  useCalendarStore((state) => state.selectedDate);
