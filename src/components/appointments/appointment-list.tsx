import { useMemo } from "react"
import { format } from "date-fns"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import type { Appointment } from "@/services"
import { APPOINTMENT_TYPE_ICONS } from "@/lib/appointment-format"
import { dateLocale } from "@/lib/locale"
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
  const { t } = useTranslation()
  // Group by project name, preserving the (soonest-first) input order.
  const groups = useMemo<ProjectGroup[]>(() => {
    const map = new Map<string, ProjectGroup>()
    for (const appt of appointments) {
      const projectName = appt.project?.project_name ?? t("appointments.unassigned")
      const group = map.get(projectName)
      if (group) group.appointments.push(appt)
      else map.set(projectName, { projectName, appointments: [appt] })
    }
    return Array.from(map.values())
  }, [appointments, t])

  if (appointments.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>{t("appointments.emptyTitle")}</EmptyTitle>
          <EmptyDescription>
            {t("appointments.emptyDescription")}
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
              ·{" "}
              {t("appointments.count", {
                count: group.appointments.length,
              })}
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.appointments.map((appt) => (
              <AppointmentCard
                key={appt.id}
                appointment={appt}
                onSelect={onSelect}
                t={t}
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
  t,
}: {
  appointment: Appointment
  onSelect: (appointment: Appointment) => void
  t: TFunction
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
          {t(`appointments.types.${appointment.appointment_type}`)}
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
          {format(new Date(appointment.scheduled_at), "yyyy-MM-dd · HH:mm", {
            locale: dateLocale(),
          })}
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
