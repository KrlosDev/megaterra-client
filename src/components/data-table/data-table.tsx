import { useLayoutEffect, useMemo, useRef, useState } from "react"
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnSizingState,
  type OnChangeFn,
  type PaginationState,
  type Row,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"

import { InboxIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTableColumnHeader } from "./column-header"
import { DataTableSidePanel } from "./side-panel"
import { DataTablePagination } from "./data-table-pagination"
import type { DataTableColumn, DataTableColumnMeta } from "./types"

const DEFAULT_PAGE_SIZE = 10
const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

/**
 * Set filter: `filterValue` is the array of *included* raw values.
 * `undefined` = no filter (all rows pass); `[]` = nothing passes.
 */
function setFilterFn<TData>(
  row: Row<TData>,
  columnId: string,
  filterValue: unknown
): boolean {
  if (filterValue == null) return true
  return (filterValue as unknown[]).includes(row.getValue(columnId))
}

function defaultCell(value: unknown): string {
  return value == null || value === "" ? "—" : String(value)
}

export type DataTableProps<TData> = {
  data: TData[]
  columns: DataTableColumn<TData>[]
  /** Show the Excel-style per-column filter. Default: false. */
  filterable?: boolean
  /** Enable drag-to-resize columns. Default: false. */
  resizable?: boolean
  /** Show the right-hand column visibility panel. Default: false. */
  columnsPanel?: boolean
  pageSize?: number
  pageSizeOptions?: number[]
  /** Pad the body with empty filler rows up to this many, so a sparsely
   * populated table keeps a stable height. Default: 0 (no padding). */
  minRows?: number
  loading?: boolean
  emptyMessage?: string
  getRowId?: (row: TData) => string
  onRowClick?: (row: TData) => void

  // --- Optional controlled / server-side (manual) mode ---
  /** Disable client-side sort/filter/paginate; caller drives them via state. */
  manual?: boolean
  sorting?: SortingState
  onSortingChange?: OnChangeFn<SortingState>
  columnFilters?: ColumnFiltersState
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>
  pagination?: PaginationState
  onPaginationChange?: OnChangeFn<PaginationState>
  /** Total row count for manual pagination. */
  rowCount?: number

  // --- Optional controlled view state (e.g. persisted to a store) ---
  columnVisibility?: VisibilityState
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>
  /** Column visibility the "Reset" action restores to (default: all visible). */
  defaultColumnVisibility?: VisibilityState
  columnSizing?: ColumnSizingState
  onColumnSizingChange?: OnChangeFn<ColumnSizingState>
}

export function DataTable<TData>({
  data,
  columns,
  filterable = false,
  resizable = false,
  columnsPanel = false,
  pageSize = DEFAULT_PAGE_SIZE,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  minRows = 0,
  loading = false,
  emptyMessage = "No data.",
  getRowId,
  onRowClick,
  manual = false,
  sorting: sortingProp,
  onSortingChange,
  columnFilters: columnFiltersProp,
  onColumnFiltersChange,
  pagination: paginationProp,
  onPaginationChange,
  rowCount,
  columnVisibility: columnVisibilityProp,
  onColumnVisibilityChange,
  defaultColumnVisibility,
  columnSizing: columnSizingProp,
  onColumnSizingChange,
}: DataTableProps<TData>) {
  const tableColumns = useMemo<ColumnDef<TData>[]>(
    () =>
      columns.map((col) => {
        const meta: DataTableColumnMeta = {
          align: col.align,
          filterLabel: col.filterLabel,
          filterOptions: col.filterOptions,
        }
        return {
          id: col.id,
          accessorFn:
            col.accessor ??
            ((row) => (row as Record<string, unknown>)[col.id]),
          header: col.header,
          cell: ({ row, getValue }) =>
            col.cell ? col.cell(row.original) : defaultCell(getValue()),
          enableSorting: col.enableSorting ?? true,
          enableColumnFilter: col.enableFilter ?? filterable,
          enableResizing: col.enableResizing ?? resizable,
          enableHiding: col.enableHiding ?? true,
          size: col.size,
          minSize: col.minSize ?? 80,
          filterFn: setFilterFn,
          meta,
        }
      }),
    [columns, filterable, resizable]
  )

  // Internal state used when the matching controlled prop is not supplied.
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({})
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  })

  const table = useReactTable<TData>({
    data,
    columns: tableColumns,
    getRowId,
    initialState: {
      columnVisibility: defaultColumnVisibility,
    },
    state: {
      sorting: sortingProp ?? sorting,
      columnFilters: columnFiltersProp ?? columnFilters,
      pagination: paginationProp ?? pagination,
      columnVisibility: columnVisibilityProp ?? columnVisibility,
      columnSizing: columnSizingProp ?? columnSizing,
    },
    onSortingChange: onSortingChange ?? setSorting,
    onColumnFiltersChange: onColumnFiltersChange ?? setColumnFilters,
    onPaginationChange: onPaginationChange ?? setPagination,
    onColumnVisibilityChange: onColumnVisibilityChange ?? setColumnVisibility,
    onColumnSizingChange: onColumnSizingChange ?? setColumnSizing,
    enableMultiSort: false,
    enableSortingRemoval: true,
    // Write the width live as the handle moves so columns track the cursor
    // smoothly. Each mousemove updates `columnSizing` (and thus any persisted
    // store); the payload is tiny, so the per-frame write is cheap.
    columnResizeMode: "onChange",
    manualSorting: manual,
    manualFiltering: manual,
    manualPagination: manual,
    rowCount: manual ? rowCount : undefined,
    getCoreRowModel: getCoreRowModel(),
    ...(manual
      ? {}
      : {
          getSortedRowModel: getSortedRowModel(),
          getFilteredRowModel: getFilteredRowModel(),
          getPaginationRowModel: getPaginationRowModel(),
          getFacetedRowModel: getFacetedRowModel(),
          getFacetedUniqueValues: getFacetedUniqueValues(),
        }),
  })

  const visibleColumnCount = table.getVisibleLeafColumns().length
  const rows = table.getRowModel().rows

  // Cap the scroll area to the height of `pageSize` rows (the header stays
  // sticky). Larger page sizes then scroll vertically instead of growing the
  // page. Measured from the DOM so it works with variable row heights.
  const headerRef = useRef<HTMLTableElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [bodyMaxHeight, setBodyMaxHeight] = useState<number>()
  const { pageIndex } = table.getState().pagination

  useLayoutEffect(() => {
    const container = scrollRef.current
    if (!container) return
    const headerHeight = headerRef.current?.getBoundingClientRect().height ?? 0
    const bodyRows = container.querySelectorAll<HTMLElement>("tbody > tr")
    if (bodyRows.length <= pageSize) {
      setBodyMaxHeight(undefined)
      return
    }
    let height = headerHeight
    for (let rowIndex = 0; rowIndex < pageSize; rowIndex++) {
      height += bodyRows[rowIndex].getBoundingClientRect().height
    }
    setBodyMaxHeight(Math.ceil(height))
  }, [rows.length, pageSize, pageIndex, loading])

  return (
    <div className="overflow-hidden rounded-md border">
      <div className="flex items-stretch">
        <div className="min-w-0 flex-1 overflow-x-auto">
          <div style={resizable ? { minWidth: table.getTotalSize() } : undefined}>
            <Table
              noWrapper
              className={cn(resizable && "w-full table-fixed")}
              style={resizable ? { minWidth: table.getTotalSize() } : undefined}
              ref={headerRef}
            >
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        style={
                          resizable ? { width: header.getSize() } : undefined
                        }
                      >
                        {header.isPlaceholder ? null : (
                          <DataTableColumnHeader
                            header={header}
                            resizable={resizable}
                          />
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
            </Table>

            <div
              ref={scrollRef}
              className="min-w-0 overflow-y-auto overflow-x-hidden"
              style={bodyMaxHeight ? { maxHeight: bodyMaxHeight } : undefined}
            >
              <Table
                noWrapper
                className={cn(resizable && "w-full table-fixed")}
                style={resizable ? { minWidth: table.getTotalSize() } : undefined}
              >
                <TableBody>
                  {loading ? (
                    Array.from({ length: 8 }).map((_, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {Array.from({ length: visibleColumnCount }).map(
                          (__, columnIndex) => (
                            <TableCell key={columnIndex}>
                              <Skeleton className="h-4 w-20" />
                            </TableCell>
                          )
                        )}
                      </TableRow>
                    ))
                  ) : rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={visibleColumnCount} className="p-0">
                        <Empty className="border-0 py-12">
                          <EmptyHeader>
                            <EmptyMedia variant="icon">
                              <InboxIcon />
                            </EmptyMedia>
                            <EmptyTitle>{emptyMessage}</EmptyTitle>
                          </EmptyHeader>
                        </Empty>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {rows.map((row) => (
                        <TableRow
                          key={row.id}
                          onClick={
                            onRowClick
                              ? () => onRowClick(row.original)
                              : undefined
                          }
                          className={cn(onRowClick && "cursor-pointer")}
                        >
                          {row.getVisibleCells().map((cell) => {
                            const meta = cell.column.columnDef.meta as
                              | DataTableColumnMeta
                              | undefined
                            return (
                              <TableCell
                                key={cell.id}
                                className={cn(
                                  meta?.align === "right" && "text-right",
                                  meta?.align === "center" && "text-center",
                                  resizable && "overflow-hidden text-ellipsis"
                                )}
                                style={
                                  resizable
                                    ? { width: cell.column.getSize() }
                                    : undefined
                                }
                              >
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </TableCell>
                            )
                          })}
                        </TableRow>
                      ))}

                      {/* Empty filler rows so a short list keeps a stable
                          height (see the `minRows` prop). */}
                      {rows.length < minRows &&
                        Array.from({ length: minRows - rows.length }).map(
                          (_, fillerIndex) => (
                            <TableRow
                              key={`filler-${fillerIndex}`}
                              aria-hidden
                              className="pointer-events-none"
                            >
                              {table.getVisibleLeafColumns().map((column) => (
                                <TableCell
                                  key={column.id}
                                  style={
                                    resizable
                                      ? { width: column.getSize() }
                                      : undefined
                                  }
                                >
                                  &nbsp;
                                </TableCell>
                              ))}
                            </TableRow>
                          )
                        )}
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {columnsPanel && <DataTableSidePanel table={table} />}
      </div>

      <DataTablePagination
        table={table}
        pageSizeOptions={pageSizeOptions}
        rowCount={manual ? rowCount : undefined}
      />
    </div>
  )
}
