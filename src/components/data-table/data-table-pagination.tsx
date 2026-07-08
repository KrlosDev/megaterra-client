import type { Table } from "@tanstack/react-table"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function DataTablePagination<TData>({
  table,
  pageSizeOptions,
  rowCount,
}: {
  table: Table<TData>
  pageSizeOptions: number[]
  /** Total row count for server-side (manual) pagination. */
  rowCount?: number
}) {
  const { t } = useTranslation()
  const { pageIndex, pageSize } = table.getState().pagination
  const total = rowCount ?? table.getFilteredRowModel().rows.length
  const pageCount = Math.max(1, table.getPageCount())
  const start = total === 0 ? 0 : pageIndex * pageSize + 1
  const end = Math.min((pageIndex + 1) * pageSize, total)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-2 py-2 text-xs">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{t("common.pageSize")}</span>
        <Select
          value={String(pageSize)}
          onValueChange={(value) => table.setPageSize(Number(value))}
        >
          <SelectTrigger size="sm" className="w-[4.5rem]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="text-muted-foreground">
        {t("common.rowsRange", { from: start, to: end, total })}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("common.firstPage")}
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronsLeftIcon />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("common.previousPage")}
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeftIcon />
        </Button>
        <span className="px-1 whitespace-nowrap">
          {t("common.pageOf", { page: pageIndex + 1, pages: pageCount })}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("common.nextPage")}
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <ChevronRightIcon />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("common.lastPage")}
          onClick={() => table.setPageIndex(pageCount - 1)}
          disabled={!table.getCanNextPage()}
        >
          <ChevronsRightIcon />
        </Button>
      </div>
    </div>
  )
}
