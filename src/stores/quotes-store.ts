import { create } from "zustand"
import { persist } from "zustand/middleware"
import {
  tableViewSlice,
  type TableViewActions,
  type TableViewState,
} from "./create-table-store"

/** The sent-status pill filter shown above the quotes table. */
export type QuoteStatusFilter = "all" | "sent" | "unsent"

/** Default visible columns: Client, Project, Price, Down %, Rate, Status,
 * Actions. Every other column starts hidden and can be toggled on via the
 * Columns panel. */
export const QUOTES_DEFAULT_COLUMN_VISIBILITY = {
  lead: false,
  phone: false,
  advisor: false,
  unit: false,
  currency: false,
  down_amount: false,
  financed: false,
  term: false,
  monthly: false,
  total: false,
  sent_at: false,
  created: false,
}

type QuotesStore = TableViewState &
  TableViewActions & {
    statusFilter: QuoteStatusFilter
    setStatusFilter: (filter: QuoteStatusFilter) => void
  }

/** Persisted state for the quotes page: the table view state (sorting / filters
 * / column visibility / widths) plus the sent-status pill filter. */
export const useQuotesStore = create<QuotesStore>()(
  persist(
    (set, get) => ({
      ...tableViewSlice<QuotesStore>(set, get),
      columnVisibility: QUOTES_DEFAULT_COLUMN_VISIBILITY,
      statusFilter: "all",
      setStatusFilter: (statusFilter) => set({ statusFilter }),
    }),
    { name: "page:quotes" }
  )
)
