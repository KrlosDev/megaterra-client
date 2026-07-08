import { useEffect, useMemo, useState } from "react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { format } from "date-fns"
import { PlusIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import { toast } from "sonner"
import {
  leadsService,
  type Lead,
  type LeadStage,
  type LeadTemperature,
} from "@/services"
import {
  LEAD_STAGE_GROUPS,
  LEAD_STAGE_GROUP_LABELS,
  type LeadStageGroup,
  LEAD_TEMPERATURE_VARIANTS,
  formatBudget,
} from "@/lib/lead-format"
import { cn } from "@/lib/utils"
import {
  useLeadsStore,
  LEADS_DEFAULT_COLUMN_VISIBILITY,
  type LeadGroupFilter,
} from "@/stores/leads-store"
import { LeadSheet } from "@/components/leads/lead-sheet"
import { HeaderSlot } from "@/components/layout/header-slot"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTable, type DataTableColumn } from "@/components/data-table"

export const Route = createFileRoute("/_authenticated/leads/")({
  component: RouteComponent,
})

function fmtDate(value: string | null): string {
  return value ? format(new Date(value), "MMM d, yyyy") : "—"
}

function createLeadColumns(t: TFunction): DataTableColumn<Lead>[] {
  return [
    {
      id: "name",
      header: t("leads.name"),
      accessor: (lead) => lead.lead_name,
      cell: (lead) => <span className="font-medium">{lead.lead_name}</span>,
      enableFilter: false,
    },
    {
      id: "email",
      header: t("leads.email"),
      accessor: (lead) => lead.lead_email,
      enableFilter: false,
    },
    {
      id: "phone",
      header: t("leads.phone"),
      accessor: (lead) => lead.lead_phone,
      enableFilter: false,
    },
    { id: "source", header: t("leads.source"), accessor: (lead) => lead.lead_source },
    { id: "ad_name", header: t("leads.adName"), accessor: (lead) => lead.ad_name },
    { id: "form_name", header: t("leads.formName"), accessor: (lead) => lead.form_name },
    {
      id: "interest",
      header: t("leads.interest"),
      accessor: (lead) => lead.target_interest,
    },
    {
      id: "budget",
      header: t("leads.budget"),
      accessor: (lead) => lead.budget_min,
      cell: (lead) =>
        formatBudget(lead.budget_min, lead.budget_max, lead.project?.currency ?? null),
      enableFilter: false,
    },
    {
      id: "temperature",
      header: t("leads.temperature"),
      align: "center",
      accessor: (lead) => lead.temperature,
      filterLabel: (value) =>
        value ? t(`leads.temperatures.${value as LeadTemperature}`) : t("leads.blank"),
      cell: (lead) =>
        lead.temperature ? (
          <Badge variant={LEAD_TEMPERATURE_VARIANTS[lead.temperature]}>
            {t(`leads.temperatures.${lead.temperature}`)}
          </Badge>
        ) : (
          "—"
        ),
    },
    {
      id: "stage",
      header: t("leads.stage"),
      accessor: (lead) => lead.lead_stage,
      filterLabel: (value) => t(`leads.stages.${value as LeadStage}`),
      cell: (lead) => (
        <Badge variant="outline">{t(`leads.stages.${lead.lead_stage}`)}</Badge>
      ),
    },
    {
      id: "project",
      header: t("leads.project"),
      accessor: (lead) => lead.project?.project_name ?? null,
    },
    {
      id: "advisor",
      header: t("leads.advisor"),
      accessor: (lead) => lead.advisor?.display_name || lead.advisor?.email || null,
    },
    {
      id: "created",
      header: t("leads.createdCol"),
      accessor: (lead) => lead.created_date,
      cell: (lead) => fmtDate(lead.created_date),
      enableFilter: false,
    },
    {
      id: "last_contacted",
      header: t("leads.lastContacted"),
      accessor: (lead) => lead.last_contacted,
      cell: (lead) => fmtDate(lead.last_contacted),
      enableFilter: false,
    },
  ]
}

function RouteComponent() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const leadColumns = useMemo(() => createLeadColumns(t), [t])

  useEffect(() => {
    let active = true
    leadsService
      .list()
      .then((data) => {
        if (active) setLeads(data)
      })
      .catch((error) => {
        toast.error(
          error instanceof Error ? error.message : t("leads.loadFailed")
        )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const tableView = useLeadsStore()
  const filter = tableView.groupFilter
  const setFilter = tableView.setGroupFilter

  // Count leads per pipeline group for the summary cards.
  const counts = useMemo(() => {
    const tally: Record<LeadStageGroup, number> = {
      new: 0,
      in_progress: 0,
      negotiation: 0,
      lost: 0,
    }
    for (const lead of leads) {
      for (const group of Object.keys(tally) as LeadStageGroup[]) {
        if ((LEAD_STAGE_GROUPS[group] as LeadStage[]).includes(lead.lead_stage)) {
          tally[group]++
          break
        }
      }
    }
    return tally
  }, [leads])

  const visibleLeads = useMemo(
    () =>
      filter === "all"
        ? leads
        : leads.filter((lead) =>
            (LEAD_STAGE_GROUPS[filter] as LeadStage[]).includes(lead.lead_stage)
          ),
    [leads, filter]
  )

  // Summary cards double as the filter: "Total Leads" clears it, each group
  // card filters to that group's stages.
  const cards: { value: LeadGroupFilter; label: string; count: number }[] = [
    { value: "all", label: t("leads.totalLeads"), count: leads.length },
    ...(Object.keys(LEAD_STAGE_GROUP_LABELS) as LeadStageGroup[]).map(
      (group) => ({
        value: group,
        label: t(`leads.groups.${group}`),
        count: counts[group],
      })
    ),
  ]

  return (
    <div className="flex flex-col gap-4 px-4 py-8">
      <HeaderSlot>
        <LeadSheet
          trigger={
            <Button size="sm">
              <PlusIcon />
              {t("leads.newLead")}
            </Button>
          }
          onSaved={(lead) => setLeads((prev) => [lead, ...prev])}
        />
      </HeaderSlot>

      {/* Summary stat cards — click to filter the table by pipeline group. */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {cards.map((card) => {
          const active = filter === card.value
          return (
            <Card
              key={card.value}
              size="sm"
              role="button"
              tabIndex={0}
              aria-pressed={active}
              onClick={() => setFilter(card.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  setFilter(card.value)
                }
              }}
              className={cn(
                "cursor-pointer py-2 transition-colors hover:border-primary/50",
                active && "border-primary ring-1 ring-primary"
              )}
            >
              <CardContent className="flex items-baseline justify-between gap-2">
                <span className="text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
                  {card.label}
                </span>
                <span className="text-xl font-semibold">
                  {loading ? <Skeleton className="h-6 w-8" /> : card.count}
                </span>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <DataTable
        data={visibleLeads}
        columns={leadColumns}
        loading={loading}
        onRowClick={(lead) =>
          navigate({ to: "/leads/$leadId", params: { leadId: lead.id } })
        }
        filterable
        resizable
        columnsPanel
        emptyMessage={t("leads.empty")}
        sorting={tableView.sorting}
        onSortingChange={tableView.setSorting}
        columnFilters={tableView.columnFilters}
        onColumnFiltersChange={tableView.setColumnFilters}
        columnVisibility={tableView.columnVisibility}
        onColumnVisibilityChange={tableView.setColumnVisibility}
        defaultColumnVisibility={LEADS_DEFAULT_COLUMN_VISIBILITY}
        columnSizing={tableView.columnSizing}
        onColumnSizingChange={tableView.setColumnSizing}
      />
    </div>
  )
}
