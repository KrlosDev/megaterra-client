import { useMemo, useState } from "react"
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { Appointment, AppointmentStatus } from "@/services"
import { APPOINTMENT_STATUS_DOT_COLORS } from "@/lib/appointment-format"
import { dateLocale } from "@/lib/locale"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

/** Statuses to surface in the calendar legend (the common outcomes). */
const LEGEND_STATUSES: AppointmentStatus[] = [
  "confirmed",
  "pending_confirmation",
  "showed_up",
  "rescheduled",
]

export function AppointmentCalendar({
  appointments,
  onSelect,
}: {
  appointments: Appointment[]
  onSelect: (appointment: Appointment) => void
}) {
  const { t, i18n } = useTranslation()
  const [month, setMonth] = useState(() => startOfMonth(new Date()))

  // Localized short weekday names (Sun–Sat), rebuilt on language change.
  const weekdays = useMemo(() => {
    const start = startOfWeek(new Date())
    return Array.from({ length: 7 }, (_, index) =>
      format(addDays(start, index), "EEE", { locale: dateLocale() })
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language])

  // Group appointments by calendar day (yyyy-MM-dd) for quick cell lookup.
  const byDay = useMemo(() => {
    const map = new Map<string, Appointment[]>()
    for (const appt of appointments) {
      const key = format(new Date(appt.scheduled_at), "yyyy-MM-dd")
      const list = map.get(key)
      if (list) list.push(appt)
      else map.set(key, [appt])
    }
    return map
  }, [appointments])

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(month)),
        end: endOfWeek(endOfMonth(month)),
      }),
    [month]
  )

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("appointments.previousMonth")}
            onClick={() => setMonth((current) => addMonths(current, -1))}
          >
            <ChevronLeftIcon />
          </Button>
          <h2 className="min-w-40 text-center text-lg font-semibold">
            {format(month, "MMMM yyyy", { locale: dateLocale() })}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("appointments.nextMonth")}
            onClick={() => setMonth((current) => addMonths(current, 1))}
          >
            <ChevronRightIcon />
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {LEGEND_STATUSES.map((status) => (
            <span key={status} className="inline-flex items-center gap-1.5">
              <span
                className={cn(
                  "size-2 rounded-full",
                  APPOINTMENT_STATUS_DOT_COLORS[status]
                )}
              />
              {t(`appointments.statuses.${status}`)}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-7 border-t">
        {weekdays.map((day) => (
          <div
            key={day}
            className="border-b p-2 text-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}

        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd")
          const dayAppointments = byDay.get(key) ?? []
          const outside = !isSameMonth(day, month)
          return (
            <div
              key={key}
              className={cn(
                "min-h-24 border-b border-r p-1.5 nth-[7n]:border-r-0",
                outside && "bg-muted/30"
              )}
            >
              <div className="flex justify-start px-1">
                <span
                  className={cn(
                    "inline-flex size-6 items-center justify-center rounded-full text-sm",
                    outside && "text-muted-foreground",
                    isToday(day) &&
                      "bg-primary font-semibold text-primary-foreground"
                  )}
                >
                  {format(day, "d")}
                </span>
              </div>
              <div className="mt-1 flex flex-col gap-0.5">
                {dayAppointments.map((appt) => (
                  <Button
                    key={appt.id}
                    variant="ghost"
                    onClick={() => onSelect(appt)}
                    className="h-auto w-full min-w-0 justify-start gap-1.5 truncate rounded px-1 py-0.5 text-left text-xs font-normal hover:bg-accent"
                    title={`${format(new Date(appt.scheduled_at), "HH:mm")} ${appt.lead?.lead_name ?? ""}`}
                  >
                    <span
                      className={cn(
                        "size-2 shrink-0 rounded-full",
                        APPOINTMENT_STATUS_DOT_COLORS[appt.status]
                      )}
                    />
                    <span className="truncate">
                      {format(new Date(appt.scheduled_at), "HH:mm")}{" "}
                      {appt.lead?.lead_name ?? "—"}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
