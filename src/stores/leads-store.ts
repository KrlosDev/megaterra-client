import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { LeadStageGroup } from "@/lib/lead-format"
import {
  tableViewSlice,
  type TableViewActions,
  type TableViewState,
} from "./create-table-store"

/** The pipeline-group filter driven by the summary cards. "all" clears it. */
export type LeadGroupFilter = "all" | LeadStageGroup

/** Default visible columns: Name, Email, Source, Budget, Stage, Project,
 * Advisor. The rest (phone, ad name, form name, interest, temperature, created,
 * last contacted) start hidden and can be toggled on via the Columns panel. */
export const LEADS_DEFAULT_COLUMN_VISIBILITY = {
  phone: false,
  ad_name: false,
  form_name: false,
  interest: false,
  temperature: false,
  created: false,
  last_contacted: false,
}

type LeadsStore = TableViewState &
  TableViewActions & {
    groupFilter: LeadGroupFilter
    setGroupFilter: (filter: LeadGroupFilter) => void
  }

/** Persisted state for the whole leads page: the table view state (sorting /
 * filters / column visibility / widths) plus the summary-card group filter. */
export const useLeadsStore = create<LeadsStore>()(
  persist(
    (set, get) => ({
      ...tableViewSlice<LeadsStore>(set, get),
      columnVisibility: LEADS_DEFAULT_COLUMN_VISIBILITY,
      groupFilter: "all",
      setGroupFilter: (groupFilter) => set({ groupFilter }),
    }),
    { name: "page:leads" }
  )
)
