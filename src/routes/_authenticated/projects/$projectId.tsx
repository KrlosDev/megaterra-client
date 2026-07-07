import { useEffect, useMemo, useState } from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { format } from "date-fns"
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  DollarSignIcon,
  HomeIcon,
  MapPinIcon,
  UsersIcon,
} from "lucide-react"
import { toast } from "sonner"
import {
  appointmentsService,
  inventoryService,
  leadsService,
  projectsService,
  type Appointment,
  type InventoryUnit,
  type Lead,
  type Project,
} from "@/services"
import { HEADER_GRADIENTS, PROJECT_STATUS_LABELS } from "@/lib/project-format"
import {
  INVENTORY_STATUS_LABELS,
  INVENTORY_STATUS_VARIANTS,
  formatPrice,
  formatSize,
} from "@/lib/inventory-format"
import { LEAD_STAGE_LABELS } from "@/lib/lead-format"
import { APPOINTMENT_TYPE_LABELS } from "@/lib/appointment-format"
import { usePageTitleStore } from "@/stores/page-title-store"
import { AppointmentStatusBadge } from "@/components/appointments/appointment-status-badge"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTable, type DataTableColumn } from "@/components/data-table"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/_authenticated/projects/$projectId")({
  component: RouteComponent,
})

function RouteComponent() {
  const { projectId } = Route.useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [units, setUnits] = useState<InventoryUnit[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.all([
      projectsService.get(projectId),
      inventoryService.list(),
      leadsService.list(),
      appointmentsService.list(),
    ])
      .then(([loadedProject, loadedUnits, loadedLeads, loadedAppointments]) => {
        if (!active) return
        setProject(loadedProject)
        setUnits(loadedUnits.filter((unit) => unit.project_id === projectId))
        setLeads(loadedLeads.filter((lead) => lead.project_id === projectId))
        setAppointments(
          loadedAppointments.filter(
            (appointment) => appointment.project_id === projectId
          )
        )
      })
      .catch((error) => {
        toast.error(
          error instanceof Error ? error.message : "Failed to load project"
        )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [projectId])

  // Show the project name in the header instead of the id slug.
  const setTitleOverride = usePageTitleStore((state) => state.setOverride)
  useEffect(() => {
    setTitleOverride(project?.project_name ?? null)
    return () => setTitleOverride(null)
  }, [project?.project_name, setTitleOverride])

  // Column defs close over the project (for currency / size formatting), so
  // rebuild them whenever the loaded project changes.
  const unitColumns = useMemo<DataTableColumn<InventoryUnit>[]>(
    () => [
      {
        id: "unit",
        header: "Unit",
        accessor: (unit) => unit.unit,
        cell: (unit) => <span className="font-medium">{unit.unit}</span>,
      },
      {
        id: "size",
        header: "Size",
        accessor: (unit) => unit.unit_size,
        cell: (unit) => formatSize(unit.unit_size, project?.size_type ?? null),
      },
      {
        id: "price",
        header: "Price",
        accessor: (unit) => unit.price,
        cell: (unit) => formatPrice(unit.price, project?.currency ?? null),
      },
      {
        id: "status",
        header: "Status",
        accessor: (unit) => unit.status,
        cell: (unit) => (
          <Badge variant={INVENTORY_STATUS_VARIANTS[unit.status]}>
            {INVENTORY_STATUS_LABELS[unit.status]}
          </Badge>
        ),
      },
    ],
    [project?.size_type, project?.currency]
  )

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink />
        <p className="text-muted-foreground">Project not found.</p>
      </div>
    )
  }

  const unitsTotal = units.length
  const unitsAvailable = units.filter(
    (unit) => unit.status === "available"
  ).length
  const soldPct =
    unitsTotal > 0
      ? Math.round(
          (units.filter((unit) => unit.status === "sold").length /
            unitsTotal) *
            100
        )
      : 0
  const residentialPrices = units
    .filter(
      (unit) => unit.unit_type === "house" || unit.unit_type === "apartment"
    )
    .map((unit) => (unit.price == null ? null : Number(unit.price)))
    .filter((price): price is number => price != null)
  const priceRange = residentialPrices.length
    ? `${formatPrice(Math.min(...residentialPrices), project.currency)} – ${formatPrice(Math.max(...residentialPrices), project.currency)}`
    : null
  const location = project.address || project.country || null

  return (
    <div className="flex flex-col gap-4">
      <BackLink />

      {/* Hero */}
      <div
        className={cn(
          "rounded-2xl bg-linear-to-br p-6",
          HEADER_GRADIENTS[project.project_status]
        )}
      >
        <Badge className="bg-background text-foreground hover:bg-background">
          {PROJECT_STATUS_LABELS[project.project_status]}
        </Badge>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">
          {project.project_name}
        </h1>
        {project.project_description && (
          <p className="mt-1 text-slate-700">{project.project_description}</p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-2 text-sm text-slate-800">
          <HeroMeta icon={<MapPinIcon className="size-4" />} value={location} />
          <HeroMeta
            icon={<HomeIcon className="size-4" />}
            value={project.inventory_description}
          />
          <HeroMeta
            icon={<DollarSignIcon className="size-4" />}
            value={priceRange}
          />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={<UsersIcon className="size-5" />}
          label="Leads"
          value={String(leads.length)}
        />
        <StatCard
          icon={<CalendarIcon className="size-5" />}
          label="Appointments"
          value={String(appointments.length)}
        />
        <StatCard
          icon={<HomeIcon className="size-5" />}
          label="Units"
          value={`${unitsAvailable}/${unitsTotal} available`}
        />
      </div>

      {/* Progress */}
      <div className="rounded-xl border bg-card p-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Commercial progress</span>
          <span className="font-semibold">{soldPct}%</span>
        </div>
        <Progress value={soldPct} />
      </div>

      {/* Inventory */}
      <div className="overflow-hidden rounded-xl border bg-card">
        <h2 className="p-5 pb-3 text-lg font-semibold">Unit inventory</h2>
        {/* Drop the DataTable's own border/rounding so it merges into the card;
            keep only its top edge as the divider under the heading. */}
        <div className="[&>div]:rounded-none [&>div]:border-x-0 [&>div]:border-b-0">
          <DataTable
            data={units}
            columns={unitColumns}
            emptyMessage="No units yet."
            resizable
          />
        </div>
      </div>

      {/* Leads + Appointments */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card">
          <h2 className="p-5 pb-2 text-lg font-semibold">Project leads</h2>
          <ul>
            {leads.length === 0 ? (
              <EmptyRow>No leads for this project.</EmptyRow>
            ) : (
              leads.map((lead) => (
                <li
                  key={lead.id}
                  className="flex items-center justify-between gap-3 border-t px-5 py-3"
                >
                  <div>
                    <div className="font-medium">{lead.lead_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {LEAD_STAGE_LABELS[lead.lead_stage]}
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {lead.advisor?.display_name || lead.advisor?.email || "—"}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-xl border bg-card">
          <h2 className="p-5 pb-2 text-lg font-semibold">Project appointments</h2>
          <ul>
            {appointments.length === 0 ? (
              <EmptyRow>No appointments for this project.</EmptyRow>
            ) : (
              appointments.map((appt) => (
                <li
                  key={appt.id}
                  className="flex items-center justify-between gap-3 border-t px-5 py-3"
                >
                  <div className="flex items-center gap-3">
                    <ClockIcon className="size-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {appt.lead?.lead_name ?? "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(appt.scheduled_at), "MMM d · HH:mm")} ·{" "}
                        {APPOINTMENT_TYPE_LABELS[appt.appointment_type]}
                      </div>
                    </div>
                  </div>
                  <AppointmentStatusBadge status={appt.status} />
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}

function BackLink() {
  return (
    <Link
      to="/projects"
      className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-primary hover:underline"
    >
      <ArrowLeftIcon className="size-4" />
      Projects
    </Link>
  )
}

function HeroMeta({
  icon,
  value,
}: {
  icon: React.ReactNode
  value: string | null
}) {
  if (!value) return null
  return (
    <span className="inline-flex items-center gap-1.5">
      {icon}
      {value}
    </span>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card p-5">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="truncate text-xl font-bold">{value}</div>
      </div>
    </div>
  )
}

function EmptyRow({ children }: { children: React.ReactNode }) {
  return (
    <li className="border-t px-5 py-6 text-center text-sm text-muted-foreground">
      {children}
    </li>
  )
}
