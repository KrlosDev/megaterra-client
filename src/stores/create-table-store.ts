import { create } from "zustand"
import { persist } from "zustand/middleware"
import type {
  ColumnFiltersState,
  ColumnSizingState,
  SortingState,
  Updater,
  VisibilityState,
} from "@tanstack/react-table"

/** Resolve a TanStack `Updater` (a value or an `(old) => new` function). */
function applyUpdater<T>(updater: Updater<T>, current: T): T {
  return typeof updater === "function"
    ? (updater as (old: T) => T)(current)
    : updater
}

/** The slice of DataTable view state we persist per table. */
export type TableViewState = {
  sorting: SortingState
  columnFilters: ColumnFiltersState
  columnVisibility: VisibilityState
  columnSizing: ColumnSizingState
}

/** Setters matching TanStack's `OnChangeFn<T>` (accept a value or updater). */
export type TableViewActions = {
  setSorting: (updater: Updater<SortingState>) => void
  setColumnFilters: (updater: Updater<ColumnFiltersState>) => void
  setColumnVisibility: (updater: Updater<VisibilityState>) => void
  setColumnSizing: (updater: Updater<ColumnSizingState>) => void
}

export const EMPTY_TABLE_VIEW: TableViewState = {
  sorting: [],
  columnFilters: [],
  columnVisibility: {},
  columnSizing: {},
}

/**
 * Reusable Zustand slice holding a table's sorting / filters / column
 * visibility / column widths. Compose it into a page store to add page-specific
 * fields, e.g. `{ ...tableViewSlice(set, get), statusFilter: "all", ... }`.
 */
export function tableViewSlice<S extends TableViewState>(
  set: (partial: Partial<S>) => void,
  get: () => S
): TableViewState & TableViewActions {
  return {
    ...EMPTY_TABLE_VIEW,
    setSorting: (updater) =>
      set({ sorting: applyUpdater(updater, get().sorting) } as Partial<S>),
    setColumnFilters: (updater) =>
      set({
        columnFilters: applyUpdater(updater, get().columnFilters),
      } as Partial<S>),
    setColumnVisibility: (updater) =>
      set({
        columnVisibility: applyUpdater(updater, get().columnVisibility),
      } as Partial<S>),
    setColumnSizing: (updater) =>
      set({
        columnSizing: applyUpdater(updater, get().columnSizing),
      } as Partial<S>),
  }
}

export type TableViewStore = TableViewState &
  TableViewActions & {
    /** Reset every persisted view setting back to defaults. */
    reset: () => void
  }

/**
 * Create a Zustand store (persisted to localStorage) that remembers a single
 * table's view state. Use this for tables that only need the standard view
 * state; pages that also persist their own controls should build a store with
 * {@link tableViewSlice} instead.
 *
 * @param persistKey Unique localStorage key, e.g. "page:leads".
 * @param initialView Optional default view state (e.g. hidden columns) applied
 *   for first-time users and when `reset()` is called.
 */
export function createTableViewStore(
  persistKey: string,
  initialView?: Partial<TableViewState>
) {
  const defaults: TableViewState = { ...EMPTY_TABLE_VIEW, ...initialView }
  return create<TableViewStore>()(
    persist(
      (set, get) => ({
        ...tableViewSlice<TableViewStore>(set, get),
        ...defaults,
        reset: () => set({ ...defaults }),
      }),
      { name: persistKey }
    )
  )
}
