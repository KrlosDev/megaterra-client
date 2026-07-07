import type { Header } from "@tanstack/react-table"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronsUpDownIcon,
  ListFilterIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { DataTableColumnFilter } from "./column-filter"
import type { DataTableColumnMeta } from "./types"

/**
 * Rendered inside each `<TableHead>`: a sort toggle (single column at a time),
 * an optional Excel-style filter popover, and an optional drag-resize handle.
 * The "3 dots" menu from the reference design is intentionally omitted.
 */
export function DataTableColumnHeader<TData>({
  header,
  resizable,
}: {
  header: Header<TData, unknown>
  resizable: boolean
}) {
  const column = header.column
  const meta = column.columnDef.meta as DataTableColumnMeta | undefined
  const align = meta?.align ?? "left"
  const label = String(column.columnDef.header ?? column.id)

  const sorted = column.getIsSorted()
  const canSort = column.getCanSort()
  // Driven per-column: a column is filterable when its `enableFilter` (or the
  // table-level `filterable` default) resolves to true.
  const canFilter = column.getCanFilter()
  const canResize = resizable && column.getCanResize()

  return (
    <div className="relative flex min-w-0 items-center gap-1 pr-5">
      {/* Label fills the cell so the icons are pushed to the right edge. */}
      {canSort ? (
        <Button
          variant="ghost"
          onClick={column.getToggleSortingHandler()}
          className={cn(
            "h-auto min-w-0 flex-1 justify-start rounded-none p-0 font-medium hover:bg-transparent hover:text-foreground",
            align === "right" && "justify-end",
            align === "center" && "justify-center"
          )}
        >
          <span className="truncate">{label}</span>
        </Button>
      ) : (
        <span
          className={cn(
            "min-w-0 flex-1 truncate font-medium",
            align === "right" && "text-right",
            align === "center" && "text-center"
          )}
        >
          {label}
        </span>
      )}

      {/* Sort + filter icons, aligned to the right of the cell. */}
      <div className="flex shrink-0 items-center gap-0.5">
        {canSort && (
          <Button
            variant="ghost"
            aria-label={`Sort ${label}`}
            onClick={column.getToggleSortingHandler()}
            className="size-auto rounded p-0.5 text-muted-foreground hover:text-foreground"
          >
            {sorted === "asc" ? (
              <ArrowUpIcon className="size-3.5 text-foreground" />
            ) : sorted === "desc" ? (
              <ArrowDownIcon className="size-3.5 text-foreground" />
            ) : (
              <ChevronsUpDownIcon className="size-3.5 text-muted-foreground/50" />
            )}
          </Button>
        )}

        {canFilter && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                aria-label={`Filter ${label}`}
                className={cn(
                  "size-auto rounded p-0.5 text-muted-foreground hover:text-foreground",
                  column.getIsFiltered() && "text-primary"
                )}
              >
                <ListFilterIcon className="size-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-56">
              <DataTableColumnFilter column={column} />
            </PopoverContent>
          </Popover>
        )}
      </div>

      {canResize && (
        <div
          onMouseDown={header.getResizeHandler()}
          onTouchStart={header.getResizeHandler()}
          onClick={(event) => event.stopPropagation()}
          className="group/resizer absolute top-0 right-0 flex h-full w-2 cursor-col-resize touch-none items-center justify-end select-none"
        >
          {/* Always-visible column separator; highlights while dragging. */}
          <div
            className={cn(
              "h-full w-px bg-border transition-colors group-hover/resizer:w-0.5 group-hover/resizer:bg-primary",
              column.getIsResizing() && "w-0.5 bg-primary"
            )}
          />
        </div>
      )}
    </div>
  )
}
