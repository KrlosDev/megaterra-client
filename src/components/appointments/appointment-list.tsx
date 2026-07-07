import { useMemo } from "react"
import { format } from "date-fns"
import type { Appointment } from "@/services"
import {
  APPOINTMENT_TYPE_ICONS,
  APPOINTMENT_TYPE_LABELS,
} from "@/lib/appointment-format"
import { AppointmentStatusBadge } from "@/components/appointments/appointment-status-badge"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"

type ProjectGroup = {
  projectName: string
  appointments: Appointment[]
}

export function AppointmentList({
  appointments,
  onSelect,
}: {
  appointments: Appointment[]
  onSelect: (appointment: Appointment) => void
}) {
  // Group by project name, preserving the (soonest-first) input order.
  const groups = useMemo<ProjectGroup[]>(() => {
    const map = new Map<string, ProjectGroup>()
    for (const appt of appointments) {
      const projectName = appt.project?.project_name ?? "Unassigned"
      const group = map.get(projectName)
      if (group) group.appointments.push(appt)
      else map.set(projectName, { projectName, appointments: [appt] })
    }
    return Array.from(map.values())
  }, [appointments])

  if (appointments.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No appointments yet</EmptyTitle>
          <EmptyDescription>
            Create your first appointment to get started.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {groups.map((group) => (
        <section key={group.projectName} className="flex flex-col gap-3">
          <div className="flex items-center gap-2 border-l-2 border-primary pl-2">
            <h2 className="font-semibold">{group.projectName}</h2>
            <span className="text-sm text-muted-foreground">
              · {group.appointments.length}{" "}
              {group.appointments.length === 1 ? "appointment" : "appointments"}
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.appointments.map((appt) => (
              <AppointmentCard
                key={appt.id}
                appointment={appt}
                onSelect={onSelect}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function AppointmentCard({
  appointment,
  onSelect,
}: {
  appointment: Appointment
  onSelect: (appointment: Appointment) => void
}) {
  const TypeIcon = APPOINTMENT_TYPE_ICONS[appointment.appointment_type]
  return (
    <Button
      variant="ghost"
      onClick={() => onSelect(appointment)}
      className="h-auto flex-col items-stretch justify-start gap-3 rounded-xl border border-border bg-card p-4 text-left font-normal whitespace-normal hover:bg-accent"
    >
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <TypeIcon className="size-4" />
          {APPOINTMENT_TYPE_LABELS[appointment.appointment_type]}
        </span>
        <AppointmentStatusBadge status={appointment.status} />
      </div>
      <div>
        <div className="font-semibold">
          {appointment.lead?.lead_name ?? "—"}
        </div>
        <div className="text-sm text-muted-foreground">
          {appointment.lead?.lead_phone ?? "—"}
        </div>
      </div>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {format(new Date(appointment.scheduled_at), "yyyy-MM-dd · HH:mm")}
        </span>
        <span>
          {appointment.advisor?.display_name ||
            appointment.advisor?.email ||
            "—"}
        </span>
      </div>
    </Button>
  )
}
