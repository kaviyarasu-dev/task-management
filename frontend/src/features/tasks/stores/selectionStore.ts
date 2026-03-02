import { create } from 'zustand';

interface SelectionState {
  selectedIds: Set<string>;
  isSelecting: boolean;
  selectAll: (ids: string[]) => void;
  selectOne: (id: string) => void;
  deselectOne: (id: string) => void;
  toggleOne: (id: string) => void;
  clearSelection: () => void;
  setSelecting: (value: boolean) => void;
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  selectedIds: new Set(),
  isSelecting: false,

  selectAll: (ids) => set({ selectedIds: new Set(ids) }),

  selectOne: (id) =>
    set((state) => ({
      selectedIds: new Set([...state.selectedIds, id]),
    })),

  deselectOne: (id) =>
    set((state) => {
      const newSet = new Set(state.selectedIds);
      newSet.delete(id);
      return { selectedIds: newSet };
    }),

  toggleOne: (id) => {
    const { selectedIds, selectOne, deselectOne } = get();
    if (selectedIds.has(id)) {
      deselectOne(id);
    } else {
      selectOne(id);
    }
  },

  clearSelection: () => set({ selectedIds: new Set(), isSelecting: false }),

  setSelecting: (value) => set({ isSelecting: value }),
}));

// Selectors
export const useSelectedCount = () =>
  useSelectionStore((state) => state.selectedIds.size);

export const useIsSelected = (id: string) =>
  useSelectionStore((state) => state.selectedIds.has(id));

// Note: Don't create a useSelectedIds hook that returns [...state.selectedIds]
// as it causes infinite re-renders. Use useSelectionStore.getState().selectedIds
// in event handlers instead.
