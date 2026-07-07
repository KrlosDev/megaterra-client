import type * as React from "react"

/**
 * Public, ergonomic column definition for {@link DataTable}. Each column is
 * mapped internally to a TanStack Table `ColumnDef`, so callers never need to
 * touch the underlying table library.
 */
export type DataTableColumn<TData> = {
  /** Stable column id; also the default accessor key (`row[id]`). */
  id: string
  /** Header label shown in the column head. */
  header: string
  /**
   * Value used for sorting / filtering / faceting. Defaults to `row[id]`.
   * Return a primitive (string | number | boolean) for best results.
   */
  accessor?: (row: TData) => unknown
  /**
   * Custom cell renderer. Receives the FULL row so it can read related fields
   * (e.g. a currency held on a nested object). Defaults to the accessor value
   * stringified.
   */
  cell?: (row: TData) => React.ReactNode
  /** Allow clicking the header to sort by this column. Default: true. */
  enableSorting?: boolean
  /** Show the Excel-style filter on this column. Default: table `filterable`. */
  enableFilter?: boolean
  /** Allow drag-resizing this column. Default: table `resizable`. */
  enableResizing?: boolean
  /** Allow hiding this column from the columns panel. Default: true. */
  enableHiding?: boolean
  /** Initial width in px. */
  size?: number
  /** Minimum width in px when resizing. */
  minSize?: number
  /** Horizontal alignment of the header + cells. Default: "left". */
  align?: "left" | "right" | "center"
  /**
   * Explicit facet values for the filter list. Required in `manual`
   * (server-side) mode where distinct values can't be derived from the page.
   */
  filterOptions?: { value: string; label: string }[]
  /** Human label for a distinct facet value in client mode. */
  filterLabel?: (value: unknown) => string
}

/** Extra per-column info stashed on the TanStack `ColumnDef.meta`. */
export type DataTableColumnMeta = {
  align?: "left" | "right" | "center"
  filterLabel?: (value: unknown) => string
  filterOptions?: { value: string; label: string }[]
}
