import { useState } from "react"
import { format } from "date-fns"
import { CalendarClockIcon } from "lucide-react"
import { toast } from "sonner"
import {
  appointmentsService,
  type Appointment,
  type AppointmentStatus,
} from "@/services"
import {
  APPOINTMENT_STATUS_DOT_COLORS,
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_OPTIONS,
  APPOINTMENT_TYPE_ICONS,
  APPOINTMENT_TYPE_LABELS,
} from "@/lib/appointment-format"
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
      toast.success("Status updated")
      onUpdated(updated)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update status"
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleReschedule() {
    if (!date || !time) {
      toast.error("Pick a new date and time")
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
      toast.success("Appointment rescheduled")
      onUpdated(updated)
      setRescheduling(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to reschedule"
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>{appointment.lead?.lead_name ?? "Appointment"}</SheetTitle>
        <SheetDescription>
          {appointment.project?.project_name ?? "—"}
        </SheetDescription>
      </SheetHeader>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 pb-6">
        <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
          <DetailRow
            label="Status"
            value={<AppointmentStatusBadge status={appointment.status} />}
          />
          <DetailRow
            label="Type"
            value={
              <span className="inline-flex items-center gap-1.5">
                <TypeIcon className="size-4" />
                {APPOINTMENT_TYPE_LABELS[appointment.appointment_type]}
              </span>
            }
          />
          <DetailRow
            label="Lead phone"
            value={appointment.lead?.lead_phone ?? "—"}
          />
          <DetailRow
            label="Advisor"
            value={
              appointment.advisor?.display_name ||
              appointment.advisor?.email ||
              "—"
            }
          />
          <DetailRow
            label="Scheduled"
            value={format(scheduled, "EEE, MMM d, yyyy · HH:mm")}
          />
          {appointment.original_scheduled_at && (
            <DetailRow
              label="Originally"
              value={format(
                new Date(appointment.original_scheduled_at),
                "MMM d, yyyy · HH:mm"
              )}
            />
          )}
          {appointment.notes && (
            <DetailRow label="Notes" value={appointment.notes} />
          )}
        </div>

        <Field>
          <FieldLabel htmlFor="detail_status">Change status</FieldLabel>
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
                  {APPOINTMENT_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {rescheduling ? (
          <div className="flex flex-col gap-4 rounded-lg border p-4">
            <Field>
              <FieldLabel htmlFor="reschedule_date">New date</FieldLabel>
              <DatePicker id="reschedule_date" value={date} onChange={setDate} />
            </Field>
            <Field>
              <FieldLabel htmlFor="reschedule_time">New hour</FieldLabel>
              <TimePicker
                id="reschedule_time"
                value={time}
                onChange={setTime}
              />
            </Field>
            <div className="flex gap-2">
              <Button onClick={handleReschedule} disabled={saving}>
                {saving ? "Saving..." : "Save new time"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setRescheduling(false)}
                disabled={saving}
              >
                Cancel
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
            Reschedule
          </Button>
        )}
      </div>
    </>
  )
}
