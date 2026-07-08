import { useState } from "react"
import { format } from "date-fns"
import { CalendarClockIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import {
  appointmentsService,
  type Appointment,
  type AppointmentStatus,
} from "@/services"
import {
  APPOINTMENT_STATUS_DOT_COLORS,
  APPOINTMENT_STATUS_OPTIONS,
  APPOINTMENT_TYPE_ICONS,
} from "@/lib/appointment-format"
import { dateLocale } from "@/lib/locale"
import { AppointmentStatusBadge } from "@/components/appointments/appointment-status-badge"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Field, FieldLabel } from "@/components/ui/field"
import { TimePicker } from "@/components/ui/time-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

/** Combine a picked date and an "HH:mm" string into an ISO timestamp. */
function toIso(date: Date, time: string): string {
  const [hours, minutes] = time.split(":").map(Number)
  const result = new Date(date)
  result.setHours(hours || 0, minutes || 0, 0, 0)
  return result.toISOString()
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}

export function AppointmentDetailSheet({
  appointment,
  open,
  onOpenChange,
  onUpdated,
}: {
  appointment: Appointment | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated: (appointment: Appointment) => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl">
        {appointment && (
          // Key by id so the editor state re-initializes per appointment.
          <DetailContent
            key={appointment.id}
            appointment={appointment}
            onUpdated={onUpdated}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

function DetailContent({
  appointment,
  onUpdated,
}: {
  appointment: Appointment
  onUpdated: (appointment: Appointment) => void
}) {
  const { t } = useTranslation()
  const scheduled = new Date(appointment.scheduled_at)
  const [saving, setSaving] = useState(false)
  const [rescheduling, setRescheduling] = useState(false)
  const [date, setDate] = useState<Date | undefined>(scheduled)
  const [time, setTime] = useState(format(scheduled, "HH:mm"))

  const TypeIcon = APPOINTMENT_TYPE_ICONS[appointment.appointment_type]

  async function handleStatusChange(status: AppointmentStatus) {
    if (status === appointment.status) return
    setSaving(true)
    try {
      const updated = await appointmentsService.update(appointment.id, { status })
      toast.success(t("appointments.statusUpdated"))
      onUpdated(updated)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("appointments.updateStatusFailed")
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleReschedule() {
    if (!date || !time) {
      toast.error(t("appointments.pickDateTime"))
      return
    }
    setSaving(true)
    try {
      const updated = await appointmentsService.update(appointment.id, {
        scheduled_at: toIso(date, time),
        status: "rescheduled",
        original_scheduled_at:
          appointment.original_scheduled_at ?? appointment.scheduled_at,
      })
      toast.success(t("appointments.rescheduled"))
      onUpdated(updated)
      setRescheduling(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("appointments.rescheduleFailed")
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>
          {appointment.lead?.lead_name ?? t("appointments.fallbackTitle")}
        </SheetTitle>
        <SheetDescription>
          {appointment.project?.project_name ?? "—"}
        </SheetDescription>
      </SheetHeader>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 pb-6">
        <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
          <DetailRow
            label={t("common.status")}
            value={<AppointmentStatusBadge status={appointment.status} />}
          />
          <DetailRow
            label={t("appointments.type")}
            value={
              <span className="inline-flex items-center gap-1.5">
                <TypeIcon className="size-4" />
                {t(`appointments.types.${appointment.appointment_type}`)}
              </span>
            }
          />
          <DetailRow
            label={t("appointments.leadPhone")}
            value={appointment.lead?.lead_phone ?? "—"}
          />
          <DetailRow
            label={t("appointments.advisor")}
            value={
              appointment.advisor?.display_name ||
              appointment.advisor?.email ||
              "—"
            }
          />
          <DetailRow
            label={t("appointments.scheduled")}
            value={format(scheduled, "EEE, MMM d, yyyy · HH:mm", {
              locale: dateLocale(),
            })}
          />
          {appointment.original_scheduled_at && (
            <DetailRow
              label={t("appointments.originally")}
              value={format(
                new Date(appointment.original_scheduled_at),
                "MMM d, yyyy · HH:mm",
                { locale: dateLocale() }
              )}
            />
          )}
          {appointment.notes && (
            <DetailRow label={t("appointments.notes")} value={appointment.notes} />
          )}
        </div>

        <Field>
          <FieldLabel htmlFor="detail_status">
            {t("appointments.changeStatus")}
          </FieldLabel>
          <Select
            value={appointment.status}
            onValueChange={(value) => handleStatusChange(value as AppointmentStatus)}
            disabled={saving}
          >
            <SelectTrigger id="detail_status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {APPOINTMENT_STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      APPOINTMENT_STATUS_DOT_COLORS[status]
                    )}
                  />
                  {t(`appointments.statuses.${status}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {rescheduling ? (
          <div className="flex flex-col gap-4 rounded-lg border p-4">
            <Field>
              <FieldLabel htmlFor="reschedule_date">
                {t("appointments.newDate")}
              </FieldLabel>
              <DatePicker id="reschedule_date" value={date} onChange={setDate} />
            </Field>
            <Field>
              <FieldLabel htmlFor="reschedule_time">
                {t("appointments.newHour")}
              </FieldLabel>
              <TimePicker
                id="reschedule_time"
                value={time}
                onChange={setTime}
              />
            </Field>
            <div className="flex gap-2">
              <Button onClick={handleReschedule} disabled={saving}>
                {saving ? t("common.saving") : t("appointments.saveNewTime")}
              </Button>
              <Button
                variant="outline"
                onClick={() => setRescheduling(false)}
                disabled={saving}
              >
                {t("common.cancel")}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={() => setRescheduling(true)}
            disabled={saving}
          >
            <CalendarClockIcon />
            {t("appointments.reschedule")}
          </Button>
        )}
      </div>
    </>
  )
}
