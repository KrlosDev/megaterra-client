import { useEffect, useMemo, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { BookmarkIcon, CalculatorIcon } from "lucide-react"
import { toast } from "sonner"
import {
  inventoryService,
  type InventoryStatus,
  type InventoryUnit,
} from "@/services"
import {
  INVENTORY_STATUS_LABELS,
  formatPrice,
  formatSize,
} from "@/lib/inventory-format"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth-store"
import {
  useInventoryStore,
  type InventoryStatusFilter,
} from "@/stores/inventory-store"
import { CreateInventorySheet } from "@/components/inventory/create-inventory-sheet"
import { QuoterSheet } from "@/components/quoter/quoter-sheet"
import { HeaderSlot } from "@/components/layout/header-slot"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTable, type DataTableColumn } from "@/components/data-table"

export const Route = createFileRoute("/_authenticated/inventory/")({
  component: RouteComponent,
})

// Color the status badge to match the design (green / amber / gray).
const STATUS_BADGE_CLASS: Record<InventoryStatus, string> = {
  available:
    "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-400",
  under_contract:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-400",
  sold: "border-border bg-muted text-muted-foreground",
}

// "all" and the status values filter active-project units; "archived"/"deleted"
// are admin-only views onto units whose parent project record was soft-removed.
const FILTERS: { value: InventoryStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "available", label: INVENTORY_STATUS_LABELS.available },
  { value: "under_contract", label: INVENTORY_STATUS_LABELS.under_contract },
  { value: "sold", label: INVENTORY_STATUS_LABELS.sold },
]

// Only shown to admins — reveal units belonging to archived / deleted projects.
const ADMIN_FILTERS: { value: InventoryStatusFilter; label: string }[] = [
  { value: "archived", label: "Archived" },
  { value: "deleted", label: "Deleted" },
]

// Columns for the inventory DataTable. Built as a factory so the row actions can
// close over the page's "open quoter" callback.
function createInventoryColumns(
  onQuote: (unit: InventoryUnit) => void
): DataTableColumn<InventoryUnit>[] {
  const sizeOf = (unit: InventoryUnit) =>
    formatSize(unit.unit_size, unit.project?.size_type ?? null)
  return [
    {
      id: "project",
      header: "Project",
      accessor: (unit) => unit.project?.project_name ?? null,
      enableFilter: true,
      cell: (unit) => (
        <span className="font-medium">{unit.project?.project_name ?? "—"}</span>
      ),
    },
    {
      id: "unit",
      header: "Unit",
      accessor: (unit) => unit.unit,
      enableFilter: true,
      cell: (unit) => {
        const size = sizeOf(unit)
        return size !== "—" ? `${unit.unit} — ${size}` : unit.unit
      },
    },
    { id: "size", header: "M²", accessor: (unit) => unit.unit_size, cell: sizeOf },
    {
      id: "price",
      header: "Price",
      accessor: (unit) => unit.price,
      cell: (unit) => formatPrice(unit.price, unit.project?.currency ?? null),
    },
    {
      id: "status",
      header: "Status",
      accessor: (unit) => unit.status,
      enableFilter: true,
      filterLabel: (value) => INVENTORY_STATUS_LABELS[value as InventoryStatus],
      cell: (unit) => (
        <Badge
          variant="outline"
          className={cn("rounded-full", STATUS_BADGE_CLASS[unit.status])}
        >
          {INVENTORY_STATUS_LABELS[unit.status]}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      align: "right",
      enableSorting: false,
      enableHiding: false,
      enableResizing: false,
      cell: (unit) =>
        unit.status === "available" ? (
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => onQuote(unit)}>
              <CalculatorIcon />
            </Button>
            <Button size="sm" onClick={() => toast("Reservations coming soon")}>
              <BookmarkIcon />
              Reserve
            </Button>
          </div>
        ) : null,
    },
  ]
}

function RouteComponent() {
  const [units, setUnits] = useState<InventoryUnit[]>([])
  const [loading, setLoading] = useState(true)
  const [quoteUnit, setQuoteUnit] = useState<InventoryUnit | null>(null)
  const isAdmin = useAuthStore((state) => state.profile?.role === "admin")
  const columns = useMemo(() => createInventoryColumns(setQuoteUnit), [])
  const store = useInventoryStore()
  const filter = store.statusFilter
  const setFilter = store.setStatusFilter

  useEffect(() => {
    let active = true
    inventoryService
      .list()
      .then((data) => {
        if (active) setUnits(data)
      })
      .catch((error) => {
        toast.error(
          error instanceof Error ? error.message : "Failed to load inventory"
        )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  // A unit is "active" unless its parent project record was archived/deleted.
  // Counts and the default views cover active units only.
  const isActive = (unit: InventoryUnit) =>
    (unit.project?.record_status ?? "active") === "active"

  const counts = useMemo(() => {
    const tally = { total: 0, available: 0, under_contract: 0, sold: 0 }
    for (const unit of units) {
      if (!isActive(unit)) continue
      tally.total++
      tally[unit.status]++
    }
    return tally
  }, [units])

  const visibleUnits = useMemo(() => {
    if (filter === "archived" || filter === "deleted") {
      return units.filter((unit) => unit.project?.record_status === filter)
    }
    const activeUnits = units.filter(isActive)
    return filter === "all"
      ? activeUnits
      : activeUnits.filter((unit) => unit.status === filter)
  }, [units, filter])

  const stats = [
    { label: "Total Units", value: counts.total },
    { label: INVENTORY_STATUS_LABELS.available, value: counts.available },
    {
      label: INVENTORY_STATUS_LABELS.under_contract,
      value: counts.under_contract,
    },
    { label: INVENTORY_STATUS_LABELS.sold, value: counts.sold },
  ]

  return (
    <div className="flex flex-col gap-4">
      <HeaderSlot>
        <CreateInventorySheet
          onCreated={(unit) => setUnits((prev) => [unit, ...prev])}
        />
      </HeaderSlot>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} size="sm" className="py-2">
            <CardContent className="flex items-baseline justify-between gap-2">
              <span className="text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
                {stat.label}
              </span>
              <span className="text-xl font-semibold">
                {loading ? <Skeleton className="h-6 w-8" /> : stat.value}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status filter pills (archived/deleted are admin-only) */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((filterOption) => (
          <Button
            key={filterOption.value}
            size="sm"
            variant={filter === filterOption.value ? "default" : "outline"}
            onClick={() => setFilter(filterOption.value)}
          >
            {filterOption.label}
          </Button>
        ))}
        {isAdmin && (
          <>
            <div className="mx-1 h-5 w-px bg-border" aria-hidden />
            {ADMIN_FILTERS.map((filterOption) => (
              <Button
                key={filterOption.value}
                size="sm"
                variant={filter === filterOption.value ? "default" : "outline"}
                onClick={() => setFilter(filterOption.value)}
              >
                {filterOption.label}
              </Button>
            ))}
          </>
        )}
      </div>

      <DataTable
        data={visibleUnits}
        columns={columns}
        loading={loading}
        resizable
        columnsPanel
        emptyMessage="No inventory yet."
        sorting={store.sorting}
        onSortingChange={store.setSorting}
        columnFilters={store.columnFilters}
        onColumnFiltersChange={store.setColumnFilters}
        columnVisibility={store.columnVisibility}
        onColumnVisibilityChange={store.setColumnVisibility}
        columnSizing={store.columnSizing}
        onColumnSizingChange={store.setColumnSizing}
      />

      {/* Shared quoter sheet, opened pre-filled by the row "Quote" action. */}
      <QuoterSheet
        open={quoteUnit !== null}
        onOpenChange={(open) => {
          if (!open) setQuoteUnit(null)
        }}
        initialUnit={quoteUnit ?? undefined}
      />
    </div>
  )
}
