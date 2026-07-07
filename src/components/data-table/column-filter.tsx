import { useMemo, useState } from "react"
import type { Column } from "@tanstack/react-table"
import { SearchIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { DataTableColumnMeta } from "./types"

type Option = { raw: unknown; label: string }

/**
 * Excel-style set filter: a searchable checkbox list of the column's distinct
 * values plus a "(Select All)" toggle. The column filter value is the array of
 * *included* raw values (`undefined` = no filter). Filters on different columns
 * combine with AND automatically (handled by TanStack Table).
 */
export function DataTableColumnFilter<TData>({
  column,
}: {
  column: Column<TData, unknown>
}) {
  const [search, setSearch] = useState("")
  const meta = column.columnDef.meta as DataTableColumnMeta | undefined

  const options = useMemo<Option[]>(() => {
    // Manual (server-side) mode: distinct values must be supplied explicitly.
    if (meta?.filterOptions) {
      return meta.filterOptions.map((option) => ({
        raw: option.value,
        label: option.label,
      }))
    }
    const raws = Array.from(column.getFacetedUniqueValues().keys())
    return raws
      .map((raw) => ({
        raw,
        label:
          meta?.filterLabel?.(raw) ??
          (raw == null || raw === "" ? "(Blank)" : String(raw)),
      }))
      .sort((optionA, optionB) => optionA.label.localeCompare(optionB.label))
  }, [column, meta])

  const filterValue = column.getFilterValue() as unknown[] | undefined
  const allSelected = filterValue == null
  const selected = useMemo(
    () => (allSelected ? null : new Set(filterValue)),
    [allSelected, filterValue]
  )

  const isChecked = (raw: unknown) => allSelected || !!selected?.has(raw)

  const commit = (next: Set<unknown>) => {
    if (next.size === options.length) column.setFilterValue(undefined)
    else column.setFilterValue(Array.from(next))
  }

  const toggle = (raw: unknown) => {
    const next = new Set<unknown>(
      allSelected ? options.map((option) => option.raw) : (selected as Set<unknown>)
    )
    if (next.has(raw)) next.delete(raw)
    else next.add(raw)
    commit(next)
  }

  const selectAllChecked: boolean | "indeterminate" = allSelected
    ? true
    : selected && selected.size > 0
      ? "indeterminate"
      : false

  const toggleSelectAll = () => {
    if (allSelected) column.setFilterValue([]) // deselect everything
    else column.setFilterValue(undefined) // select everything (clear filter)
  }

  const visible = search
    ? options.filter((option) =>
        option.label.toLowerCase().includes(search.toLowerCase())
      )
    : options

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search..."
          className="h-8 pl-7"
        />
      </div>

      <label className="flex items-center gap-2 px-1 font-medium">
        <Checkbox
          checked={selectAllChecked}
          onCheckedChange={toggleSelectAll}
        />
        (Select All)
      </label>

      <ScrollArea className="h-48">
        <div className="flex flex-col gap-1 pr-2">
          {visible.length === 0 ? (
            <p className="px-1 py-2 text-muted-foreground">No values</p>
          ) : (
            visible.map((option, index) => (
              <label
                key={`${String(option.raw)}-${index}`}
                className="flex items-center gap-2 px-1"
              >
                <Checkbox
                  checked={isChecked(option.raw)}
                  onCheckedChange={() => toggle(option.raw)}
                />
                <span className="truncate">{option.label}</span>
              </label>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="xs"
          disabled={allSelected && !search}
          onClick={() => {
            column.setFilterValue(undefined)
            setSearch("")
          }}
        >
          Clear
        </Button>
      </div>
    </div>
  )
}
