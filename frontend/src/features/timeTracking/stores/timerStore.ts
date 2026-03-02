import { create } from 'zustand';
import type { TimeEntry } from '../types/timeEntry.types';
import { timeTrackingApi } from '../services/timeTrackingApi';

interface TimerState {
  activeEntry: TimeEntry | null;
  elapsedSeconds: number;
  isRunning: boolean;
  isLoading: boolean;
  error: string | null;
  intervalId: ReturnType<typeof setInterval> | null;

  // Actions
  setActiveEntry: (entry: TimeEntry | null) => void;
  start: (taskId: string, description?: string) => Promise<void>;
  stop: () => Promise<void>;
  tick: () => void;
  startTicking: () => void;
  stopTicking: () => void;
  fetchActiveTimer: () => Promise<void>;
  reset: () => void;
}

function calculateElapsedSeconds(startedAt: string): number {
  const startTime = new Date(startedAt).getTime();
  const now = Date.now();
  return Math.floor((now - startTime) / 1000);
}

export const useTimerStore = create<TimerState>((set, get) => ({
  activeEntry: null,
  elapsedSeconds: 0,
  isRunning: false,
  isLoading: false,
  error: null,
  intervalId: null,

  setActiveEntry: (entry) => {
    const state = get();

    // Clear existing interval
    if (state.intervalId) {
      clearInterval(state.intervalId);
    }

    if (entry && !entry.endedAt) {
      set({
        activeEntry: entry,
        elapsedSeconds: calculateElapsedSeconds(entry.startedAt),
        isRunning: true,
        error: null,
        intervalId: null,
      });
      // Start ticking after state is set
      get().startTicking();
    } else {
      set({
        activeEntry: null,
        elapsedSeconds: 0,
        isRunning: false,
        error: null,
        intervalId: null,
      });
    }
  },

  start: async (taskId, description) => {
    set({ isLoading: true, error: null });

    try {
      const response = await timeTrackingApi.startTimer({ taskId, description });
      const entry = response.data;

      set({
        activeEntry: entry,
        elapsedSeconds: 0,
        isRunning: true,
        isLoading: false,
      });

      get().startTicking();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start timer';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  stop: async () => {
    const { activeEntry, stopTicking } = get();

    if (!activeEntry) return;

    set({ isLoading: true, error: null });
    stopTicking();

    try {
      await timeTrackingApi.stopTimer(activeEntry._id);

      set({
        activeEntry: null,
        elapsedSeconds: 0,
        isRunning: false,
        isLoading: false,
      });
    } catch (error) {
      // Restart ticking if stop failed
      get().startTicking();

      const message = error instanceof Error ? error.message : 'Failed to stop timer';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  tick: () => {
    set((state) => ({
      elapsedSeconds: state.elapsedSeconds + 1,
    }));
  },

  startTicking: () => {
    const state = get();

    // Clear any existing interval
    if (state.intervalId) {
      clearInterval(state.intervalId);
    }

    const intervalId = setInterval(() => {
      get().tick();
    }, 1000);

    set({ intervalId });
  },

  stopTicking: () => {
    const { intervalId } = get();

    if (intervalId) {
      clearInterval(intervalId);
      set({ intervalId: null });
    }
  },

  fetchActiveTimer: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await timeTrackingApi.getActiveTimer();
      const entry = response.data;

      if (entry) {
        get().setActiveEntry(entry);
      } else {
        set({
          activeEntry: null,
          elapsedSeconds: 0,
          isRunning: false,
        });
      }

      set({ isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch active timer';
      set({ isLoading: false, error: message });
    }
  },

  reset: () => {
    const { stopTicking } = get();
    stopTicking();

    set({
      activeEntry: null,
      elapsedSeconds: 0,
      isRunning: false,
      isLoading: false,
      error: null,
      intervalId: null,
    });
  },
}));

// Selectors
export const useActiveTimer = () => useTimerStore((state) => state.activeEntry);
export const useElapsedSeconds = () => useTimerStore((state) => state.elapsedSeconds);
export const useIsTimerRunning = () => useTimerStore((state) => state.isRunning);
export const useTimerLoading = () => useTimerStore((state) => state.isLoading);
export const useTimerError = () => useTimerStore((state) => state.error);
export const useTimerTaskId = () => useTimerStore((state) => state.activeEntry?.taskId ?? null);
