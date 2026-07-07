import type { Table } from "@tanstack/react-table"
import { Columns3Icon, RotateCcwIcon } from "lucide-react"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"

/**
 * Vertical tool strip that lives flush against the right edge of the table
 * (inside the shared border, so there's no visible seam). Holds a "Columns"
 * visibility popover and a "Reset" action that clears sorting / filters /
 * column visibility / column widths back to their defaults.
 */
export function DataTableSidePanel<TData>({ table }: { table: Table<TData> }) {
  const hideableColumns = table
    .getAllLeafColumns()
    .filter((column) => column.getCanHide())

  const resetView = () => {
    table.resetSorting()
    table.resetColumnFilters()
    table.resetColumnVisibility()
    table.resetColumnSizing()
  }

  return (
    <div className="flex shrink-0 flex-col items-stretch border-l bg-muted/30 text-muted-foreground">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="h-auto justify-start gap-1.5 rounded-none px-1.5 py-3 text-xs font-normal text-muted-foreground [writing-mode:vertical-rl]"
          >
            <Columns3Icon className="rotate-90" />
            Columns
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" side="left" className="w-52">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Columns</span>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => table.toggleAllColumnsVisible(true)}
            >
              Show all
            </Button>
          </div>
          <div className="flex flex-col gap-1">
            {hideableColumns.map((column) => (
              <label
                key={column.id}
                className="flex items-center gap-2 px-1 py-0.5"
              >
                <Checkbox
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                />
                <span className="truncate">
                  {String(column.columnDef.header ?? column.id)}
                </span>
              </label>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <Button
        variant="ghost"
        onClick={resetView}
        className="h-auto justify-start gap-1.5 rounded-none border-t px-1.5 py-3 text-xs font-normal text-muted-foreground [writing-mode:vertical-rl]"
      >
        <RotateCcwIcon className="rotate-90" />
        Reset
      </Button>
    </div>
  )
}
