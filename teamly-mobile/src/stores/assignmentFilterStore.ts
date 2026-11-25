import { create } from "zustand";

export interface AssignmentFiltersState {
  searchQuery: string;
  statusCode: string | null;
  priorityCode: string | null;
  subjectId: number | null;
  setSearchQuery: (q: string) => void;
  setFilters: (filters: {
    statusCode: string | null;
    priorityCode: string | null;
    subjectId: number | null;
  }) => void;
  clearFilters: () => void;
  resetAll: () => void;
}

export const useAssignmentFilterStore = create<AssignmentFiltersState>((set) => ({
  searchQuery: "",
  statusCode: null,
  priorityCode: null,
  subjectId: null,

  setSearchQuery: (q: string) => set({ searchQuery: q }),

  setFilters: ({ statusCode, priorityCode, subjectId }) =>
    set({ statusCode, priorityCode, subjectId }),

  clearFilters: () =>
    set({ statusCode: null, priorityCode: null, subjectId: null }),

  resetAll: () =>
    set({
      searchQuery: "",
      statusCode: null,
      priorityCode: null,
      subjectId: null,
    }),
}));
