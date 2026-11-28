import { create } from "zustand";

export type AssignmentSortOption =
  | "due_asc"
  | "due_desc"
  | "priority"
  | "subject"
  | "status";

export interface AssignmentFiltersState {
  searchQuery: string;
  statusCode: string | null;
  priorityCode: string | null;
  subjectId: number | null;
  sortBy: AssignmentSortOption;
  setSearchQuery: (q: string) => void;
  setFilters: (filters: {
    statusCode: string | null;
    priorityCode: string | null;
    subjectId: number | null;
    sortBy?: AssignmentSortOption;
  }) => void;
  clearFilters: () => void;
  resetAll: () => void;
}

export const useAssignmentFilterStore = create<AssignmentFiltersState>((set) => ({
  searchQuery: "",
  statusCode: null,
  priorityCode: null,
  subjectId: null,
  sortBy: "due_asc",

  setSearchQuery: (q: string) => set({ searchQuery: q }),

  setFilters: ({ statusCode, priorityCode, subjectId, sortBy }) =>
    set((state) => ({
      statusCode,
      priorityCode,
      subjectId,
      sortBy: sortBy ?? state.sortBy,
    })),

  clearFilters: () =>
    set({
      statusCode: null,
      priorityCode: null,
      subjectId: null,
      sortBy: "due_asc",
    }),

  resetAll: () =>
    set({
      searchQuery: "",
      statusCode: null,
      priorityCode: null,
      subjectId: null,
      sortBy: "due_asc",
    }),
}));
