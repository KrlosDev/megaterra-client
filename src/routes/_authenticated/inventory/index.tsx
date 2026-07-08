import { useEffect, useMemo, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { BookmarkIcon, CalculatorIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import { toast } from "sonner"
import {
  inventoryService,
  type InventoryStatus,
  type InventoryUnit,
} from "@/services"
import { formatPrice, formatSize } from "@/lib/inventory-format"
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
const FILTER_VALUES: InventoryStatusFilter[] = [
  "all",
  "available",
  "under_contract",
  "sold",
]

// Only shown to admins — reveal units belonging to archived / deleted projects.
const ADMIN_FILTER_VALUES: InventoryStatusFilter[] = ["archived", "deleted"]

/** Label for a status filter pill in the active language. */
function filterLabel(t: TFunction, value: InventoryStatusFilter): string {
  if (value === "all") return t("common.all")
  if (value === "archived") return t("inventory.archived")
  if (value === "deleted") return t("inventory.deleted")
  return t(`inventory.statuses.${value}`)
}

// Columns for the inventory DataTable. Built as a factory so the row actions can
// close over the page's "open quoter" callback.
function createInventoryColumns(
  t: TFunction,
  onQuote: (unit: InventoryUnit) => void
): DataTableColumn<InventoryUnit>[] {
  const sizeOf = (unit: InventoryUnit) =>
    formatSize(unit.unit_size, unit.project?.size_type ?? null)
  return [
    {
      id: "project",
      header: t("inventory.project"),
      accessor: (unit) => unit.project?.project_name ?? null,
      enableFilter: true,
      cell: (unit) => (
        <span className="font-medium">{unit.project?.project_name ?? "—"}</span>
      ),
    },
    {
      id: "unit",
      header: t("inventory.unit"),
      accessor: (unit) => unit.unit,
      enableFilter: true,
      cell: (unit) => unit.unit,
    },
    {
      id: "size",
      header: t("inventory.size"),
      accessor: (unit) => unit.unit_size,
      cell: sizeOf,
    },
    {
      id: "price",
      header: t("inventory.price"),
      accessor: (unit) => unit.price,
      cell: (unit) => formatPrice(unit.price, unit.project?.currency ?? null),
    },
    {
      id: "status",
      header: t("common.status"),
      accessor: (unit) => unit.status,
      enableFilter: true,
      filterLabel: (value) => t(`inventory.statuses.${value as InventoryStatus}`),
      cell: (unit) => (
        <Badge
          variant="outline"
          className={cn("rounded-full", STATUS_BADGE_CLASS[unit.status])}
        >
          {t(`inventory.statuses.${unit.status}`)}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: t("common.actions"),
      align: "right",
      enableSorting: false,
      enableHiding: false,
      enableResizing: false,
      cell: (unit) =>
        unit.status === "available" ? (
          <div className="flex justify-end gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={() => onQuote(unit)}
              aria-label={t("inventory.quote")}
            >
              <CalculatorIcon />
            </Button>
            <Button
              size="sm"
              onClick={() => toast(t("inventory.reservationsComingSoon"))}
            >
              <BookmarkIcon />
              {t("inventory.reserve")}
            </Button>
          </div>
        ) : null,
    },
  ]
}

function RouteComponent() {
  const { t } = useTranslation()
  const [units, setUnits] = useState<InventoryUnit[]>([])
  const [loading, setLoading] = useState(true)
  const [quoteUnit, setQuoteUnit] = useState<InventoryUnit | null>(null)
  const isAdmin = useAuthStore((state) => state.profile?.role === "admin")
  const columns = useMemo(() => createInventoryColumns(t, setQuoteUnit), [t])
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
          error instanceof Error ? error.message : t("inventory.loadFailed")
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
    { key: "total", label: t("inventory.totalUnits"), value: counts.total },
    {
      key: "available",
      label: t("inventory.statuses.available"),
      value: counts.available,
    },
    {
      key: "under_contract",
      label: t("inventory.statuses.under_contract"),
      value: counts.under_contract,
    },
    { key: "sold", label: t("inventory.statuses.sold"), value: counts.sold },
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
          <Card key={stat.key} size="sm" className="py-2">
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
        {FILTER_VALUES.map((value) => (
          <Button
            key={value}
            size="sm"
            variant={filter === value ? "default" : "outline"}
            onClick={() => setFilter(value)}
          >
            {filterLabel(t, value)}
          </Button>
        ))}
        {isAdmin && (
          <>
            <div className="mx-1 h-5 w-px bg-border" aria-hidden />
            {ADMIN_FILTER_VALUES.map((value) => (
              <Button
                key={value}
                size="sm"
                variant={filter === value ? "default" : "outline"}
                onClick={() => setFilter(value)}
              >
                {filterLabel(t, value)}
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
        emptyMessage={t("inventory.empty")}
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
