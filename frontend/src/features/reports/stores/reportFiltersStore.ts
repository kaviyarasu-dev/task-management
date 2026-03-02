import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ReportFilters, ReportTab, DateRangePreset } from '../types/report.types';

/**
 * Calculate date range from a preset value
 */
function getDateRangeFromPreset(preset: DateRangePreset): { start: string; end: string } {
  const today = new Date();
  const end = today.toISOString().split('T')[0];

  switch (preset) {
    case 'today':
      return { start: end, end };

    case 'last7days': {
      const last7 = new Date(today);
      last7.setDate(last7.getDate() - 7);
      return { start: last7.toISOString().split('T')[0], end };
    }

    case 'last30days': {
      const last30 = new Date(today);
      last30.setDate(last30.getDate() - 30);
      return { start: last30.toISOString().split('T')[0], end };
    }

    case 'thisMonth': {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start: startOfMonth.toISOString().split('T')[0], end };
    }

    case 'lastMonth': {
      const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      return {
        start: startOfLastMonth.toISOString().split('T')[0],
        end: endOfLastMonth.toISOString().split('T')[0],
      };
    }

    case 'thisQuarter': {
      const quarter = Math.floor(today.getMonth() / 3);
      const startOfQuarter = new Date(today.getFullYear(), quarter * 3, 1);
      return { start: startOfQuarter.toISOString().split('T')[0], end };
    }

    case 'custom':
    default: {
      const defaultStart = new Date(today);
      defaultStart.setDate(defaultStart.getDate() - 30);
      return { start: defaultStart.toISOString().split('T')[0], end };
    }
  }
}

interface ReportFiltersState {
  activeTab: ReportTab;
  filters: ReportFilters;
  setActiveTab: (tab: ReportTab) => void;
  setDateRange: (start: string, end: string) => void;
  setDateRangePreset: (preset: DateRangePreset) => void;
  setProjectId: (projectId?: string) => void;
  setUserId: (userId?: string) => void;
  clearFilters: () => void;
}

const defaultDateRange = getDateRangeFromPreset('last30days');

export const useReportFiltersStore = create<ReportFiltersState>()(
  persist(
    (set) => ({
      activeTab: 'team',
      filters: {
        dateRange: { ...defaultDateRange, preset: 'last30days' },
        projectId: undefined,
        userId: undefined,
      },

      setActiveTab: (tab) => set({ activeTab: tab }),

      setDateRange: (start, end) =>
        set((state) => ({
          filters: {
            ...state.filters,
            dateRange: { start, end, preset: 'custom' },
          },
        })),

      setDateRangePreset: (preset) =>
        set((state) => ({
          filters: {
            ...state.filters,
            dateRange: { ...getDateRangeFromPreset(preset), preset },
          },
        })),

      setProjectId: (projectId) =>
        set((state) => ({
          filters: { ...state.filters, projectId },
        })),

      setUserId: (userId) =>
        set((state) => ({
          filters: { ...state.filters, userId },
        })),

      clearFilters: () =>
        set({
          filters: {
            dateRange: { ...getDateRangeFromPreset('last30days'), preset: 'last30days' },
            projectId: undefined,
            userId: undefined,
          },
        }),
    }),
    {
      name: 'report-filters-storage',
      partialize: (state) => ({
        filters: state.filters,
        activeTab: state.activeTab,
      }),
    }
  )
);

// Selectors
export const useActiveTab = () => useReportFiltersStore((state) => state.activeTab);
export const useReportFilters = () => useReportFiltersStore((state) => state.filters);
