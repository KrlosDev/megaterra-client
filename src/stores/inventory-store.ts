import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { InventoryStatus } from "@/services"
import {
  tableViewSlice,
  type TableViewActions,
  type TableViewState,
} from "./create-table-store"

/** The status pill filter shown above the inventory table. "archived"/"deleted"
 * are admin-only views onto soft-removed projects' units. */
export type InventoryStatusFilter =
  | "all"
  | InventoryStatus
  | "archived"
  | "deleted"

type InventoryStore = TableViewState &
  TableViewActions & {
    statusFilter: InventoryStatusFilter
    setStatusFilter: (filter: InventoryStatusFilter) => void
  }

/** Persisted state for the whole inventory page: the table view state (sorting /
 * filters / column visibility / widths) plus the status pill filter. */
export const useInventoryStore = create<InventoryStore>()(
  persist(
    (set, get) => ({
      ...tableViewSlice<InventoryStore>(set, get),
      statusFilter: "all",
      setStatusFilter: (statusFilter) => set({ statusFilter }),
    }),
    { name: "page:inventory" }
  )
)
