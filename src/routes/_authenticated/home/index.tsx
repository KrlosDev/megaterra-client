import { useEffect, useMemo, useState } from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { format, formatDistanceToNow } from "date-fns"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import {
  ArrowRightIcon,
  Building2Icon,
  CalendarCheckIcon,
  ClockIcon,
  FileTextIcon,
  FlameIcon,
  HandshakeIcon,
  UsersIcon,
} from "lucide-react"
import { toast } from "sonner"
import {
  appointmentsService,
  inventoryService,
  leadsService,
  quotesService,
  type Appointment,
  type InventoryUnit,
  type Lead,
  type LeadStage,
  type Quote,
} from "@/services"
import {
  LEAD_STAGE_GROUPS,
  LEAD_STAGE_GROUP_LABELS,
  LEAD_TEMPERATURE_VARIANTS,
  type LeadStageGroup,
} from "@/lib/lead-format"
import { dateLocale } from "@/lib/locale"
import { useAuthStore } from "@/stores/auth-store"
import { LeadsAttributionChart } from "@/components/dashboard/leads-attribution-chart"
import { AppointmentStatusBadge } from "@/components/appointments/appointment-status-badge"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export const Route = createFileRoute("/_authenticated/home/")({
  component: RouteComponent,
})

const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const LOST_STAGES = LEAD_STAGE_GROUPS.lost as LeadStage[]
const NEGOTIATION_STAGES = LEAD_STAGE_GROUPS.negotiation as LeadStage[]
/** Appointment statuses that still count as an upcoming/active visit. */
const ACTIVE_APPT = new Set(["pending_confirmation", "confirmed", "rescheduled"])

/** Open = still workable (not lost, not already in negotiation/closing). */
function isOpen(lead: Lead): boolean {
  return (
    !LOST_STAGES.includes(lead.lead_stage) &&
    !NEGOTIATION_STAGES.includes(lead.lead_stage)
  )
}

function RouteComponent() {
  const { t } = useTranslation()
  const profile = useAuthStore((state) => state.profile)
  const isAdmin = profile?.role === "admin"

  const [leads, setLeads] = useState<Lead[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [inventory, setInventory] = useState<InventoryUnit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.all([
      leadsService.list(),
      appointmentsService.list(),
      quotesService.list(),
      inventoryService.list(),
    ])
      .then(([loadedLeads, loadedAppts, loadedQuotes, loadedInventory]) => {
        if (!active) return
        setLeads(loadedLeads)
        setAppointments(loadedAppts)
        setQuotes(loadedQuotes)
        setInventory(loadedInventory)
      })
      .catch((error) => {
        toast.error(
          error instanceof Error ? error.message : t("dashboard.loadFailed")
        )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  // Executives see only their own book of business; admins see everything.
  // Inventory is shared, so it is never scoped.
  const scoped = useMemo(() => {
    if (isAdmin) return { leads, appointments, quotes }
    const advisorId = profile?.id ?? null
    return {
      leads: leads.filter((lead) => lead.advisor_id === advisorId),
      appointments: appointments.filter((appt) => appt.advisor_id === advisorId),
      quotes: quotes.filter((quote) => quote.advisor_id === advisorId),
    }
  }, [isAdmin, profile?.id, leads, appointments, quotes])

  const metrics = useMemo(
    () => deriveMetrics(scoped.leads, scoped.appointments, scoped.quotes, inventory),
    [scoped, inventory]
  )

  const greeting = profile?.display_name
    ? t("dashboard.welcomeNamed", { name: profile.display_name })
    : t("dashboard.welcome")

  const stats: StatCardProps[] = [
    {
      label: t("dashboard.newLeadsWeek"),
      value: metrics.newLeadsWeek,
      icon: <UsersIcon className="size-4" />,
      to: "/leads",
    },
    {
      label: t("dashboard.hotLeads"),
      value: metrics.hotLeadsCount,
      icon: <FlameIcon className="size-4" />,
      to: "/leads",
    },
    {
      label: t("dashboard.upcomingVisits"),
      value: metrics.upcoming.length,
      icon: <CalendarCheckIcon className="size-4" />,
      to: "/appointments",
    },
    {
      label: t("dashboard.quotesSentMonth"),
      value: metrics.quotesSentMonth,
      icon: <FileTextIcon className="size-4" />,
      to: "/quotes",
    },
    {
      label: t("dashboard.unitsAvailable"),
      value: metrics.unitsAvailable,
      icon: <Building2Icon className="size-4" />,
      to: "/inventory",
    },
    {
      label: t("dashboard.underContract"),
      value: metrics.unitsUnderContract,
      icon: <HandshakeIcon className="size-4" />,
      to: "/inventory",
    },
  ]

  return (
    <div className="flex flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">{greeting}</h1>
        <p className="text-sm text-muted-foreground">{t("dashboard.subtitle")}</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} loading={loading} />
        ))}
      </div>

      {/* Attribution chart + pipeline snapshot */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LeadsAttributionChart leads={scoped.leads} />
        </div>
        <PipelineSnapshot counts={metrics.pipelineCounts} total={scoped.leads.length} />
      </div>

      {/* Needs-attention lists */}
      <div className="grid gap-4 lg:grid-cols-3">
        <AttentionCard
          title={t("dashboard.upcomingTitle")}
          to="/appointments"
          empty={metrics.upcoming.length === 0 ? t("dashboard.upcomingEmpty") : null}
        >
          {metrics.upcoming.slice(0, 6).map((appt) => (
            <li key={appt.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="flex min-w-0 items-center gap-2">
                <ClockIcon className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">
                    {appt.lead?.lead_name ?? "—"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(appt.scheduled_at), "MMM d · HH:mm", {
                      locale: dateLocale(),
                    })}
                  </div>
                </div>
              </div>
              <AppointmentStatusBadge status={appt.status} className="shrink-0" />
            </li>
          ))}
        </AttentionCard>

        <AttentionCard
          title={t("dashboard.followUpTitle")}
          to="/leads"
          empty={metrics.followUps.length === 0 ? t("dashboard.followUpEmpty") : null}
        >
          {metrics.followUps.slice(0, 6).map((lead) => (
            <LeadRow key={lead.id} lead={lead} t={t} />
          ))}
        </AttentionCard>

        <AttentionCard
          title={t("dashboard.hotWaitingTitle")}
          to="/leads"
          empty={metrics.hotWaiting.length === 0 ? t("dashboard.hotWaitingEmpty") : null}
        >
          {metrics.hotWaiting.slice(0, 6).map((lead) => (
            <LeadRow key={lead.id} lead={lead} t={t} />
          ))}
        </AttentionCard>
      </div>
    </div>
  )
}

/** All derived numbers/lists for the dashboard, computed once per data change. */
function deriveMetrics(
  leads: Lead[],
  appointments: Appointment[],
  quotes: Quote[],
  inventory: InventoryUnit[]
) {
  const now = Date.now()
  const weekAgo = now - WEEK_MS
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const newLeadsWeek = leads.filter(
    (lead) => new Date(lead.created_date).getTime() >= weekAgo
  ).length

  const hotLeads = leads.filter((lead) => lead.temperature === "hot" && isOpen(lead))

  const upcoming = appointments
    .filter(
      (appt) =>
        new Date(appt.scheduled_at).getTime() >= now && ACTIVE_APPT.has(appt.status)
    )
    .sort(
      (first, second) =>
        new Date(first.scheduled_at).getTime() -
        new Date(second.scheduled_at).getTime()
    )

  // Lead ids that already have an upcoming visit — used to flag hot leads without one.
  const leadsWithUpcoming = new Set(upcoming.map((appt) => appt.lead_id))

  const quotesSentMonth = quotes.filter((quote) => {
    if (!quote.sent) return false
    const when = new Date(quote.sent_at ?? quote.created_at)
    return when.getMonth() === currentMonth && when.getFullYear() === currentYear
  }).length

  const activeUnits = inventory.filter(
    (unit) => unit.project?.record_status !== "deleted"
  )
  const unitsAvailable = activeUnits.filter((unit) => unit.status === "available").length
  const unitsUnderContract = activeUnits.filter(
    (unit) => unit.status === "under_contract"
  ).length

  // Open leads not contacted in the last week (or never) — oldest contact first.
  const followUps = leads
    .filter(
      (lead) =>
        isOpen(lead) &&
        (!lead.last_contacted ||
          new Date(lead.last_contacted).getTime() < weekAgo)
    )
    .sort(
      (first, second) =>
        (first.last_contacted ? new Date(first.last_contacted).getTime() : 0) -
        (second.last_contacted ? new Date(second.last_contacted).getTime() : 0)
    )

  const hotWaiting = hotLeads.filter((lead) => !leadsWithUpcoming.has(lead.id))

  const pipelineCounts = { new: 0, in_progress: 0, negotiation: 0, lost: 0 } as Record<
    LeadStageGroup,
    number
  >
  for (const lead of leads) {
    for (const group of Object.keys(pipelineCounts) as LeadStageGroup[]) {
      if ((LEAD_STAGE_GROUPS[group] as LeadStage[]).includes(lead.lead_stage)) {
        pipelineCounts[group]++
        break
      }
    }
  }

  return {
    newLeadsWeek,
    hotLeadsCount: hotLeads.length,
    upcoming,
    quotesSentMonth,
    unitsAvailable,
    unitsUnderContract,
    followUps,
    hotWaiting,
    pipelineCounts,
  }
}

type StatCardProps = {
  label: string
  value: number
  icon: React.ReactNode
  to: string
  loading?: boolean
}

function StatCard({ label, value, icon, to, loading }: StatCardProps) {
  return (
    <Link to={to} className="block">
      <Card size="sm" className="h-full transition-colors hover:ring-primary/40">
        <CardContent className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="text-xl font-semibold tabular-nums">
              {loading ? <Skeleton className="h-6 w-8" /> : value}
            </span>
            <span className="truncate text-xs text-muted-foreground">{label}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function PipelineSnapshot({
  counts,
  total,
}: {
  counts: Record<LeadStageGroup, number>
  total: number
}) {
  const { t } = useTranslation()
  const groups = Object.keys(LEAD_STAGE_GROUP_LABELS) as LeadStageGroup[]
  const max = groups.reduce((largest, group) => Math.max(largest, counts[group]), 0)

  return (
    <div className="flex h-full flex-col rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("dashboard.pipelineTitle")}</h2>
        <Link
          to="/pipeline"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          {t("dashboard.viewAll")}
          <ArrowRightIcon className="size-3.5" />
        </Link>
      </div>

      {total === 0 ? (
        <p className="flex flex-1 items-center justify-center py-10 text-sm text-muted-foreground">
          {t("dashboard.pipelineEmpty")}
        </p>
      ) : (
        <ul className="mt-5 flex flex-col gap-4">
          {groups.map((group) => (
            <li key={group} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-muted-foreground">
                  {t(`leads.groups.${group}`)}
                </span>
                <span className="font-semibold tabular-nums">{counts[group]}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width]"
                  style={{ width: max > 0 ? `${(counts[group] / max) * 100}%` : "0%" }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function AttentionCard({
  title,
  to,
  empty,
  children,
}: {
  title: string
  to: string
  empty: string | null
  children: React.ReactNode
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Link
          to={to}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          {t("dashboard.viewAll")}
          <ArrowRightIcon className="size-3.5" />
        </Link>
      </div>
      {empty ? (
        <p className="flex flex-1 items-center justify-center py-8 text-sm text-muted-foreground">
          {empty}
        </p>
      ) : (
        <ul className="mt-1 divide-y">{children}</ul>
      )}
    </div>
  )
}

function LeadRow({ lead, t }: { lead: Lead; t: TFunction }) {
  const lastContact = lead.last_contacted
    ? formatDistanceToNow(new Date(lead.last_contacted), {
        addSuffix: true,
        locale: dateLocale(),
      })
    : t("dashboard.neverContacted")

  return (
    <li>
      <Link
        to="/leads/$leadId"
        params={{ leadId: lead.id }}
        className="flex items-center justify-between gap-3 py-2.5 hover:opacity-80"
      >
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{lead.lead_name}</div>
          <div className="text-xs text-muted-foreground">{lastContact}</div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {lead.temperature && (
            <Badge variant={LEAD_TEMPERATURE_VARIANTS[lead.temperature]}>
              {t(`leads.temperatures.${lead.temperature}`)}
            </Badge>
          )}
        </div>
      </Link>
    </li>
  )
}
