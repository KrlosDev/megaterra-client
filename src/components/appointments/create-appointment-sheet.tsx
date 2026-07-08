import { useEffect, useMemo, useState } from "react"
import { PlusIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import {
  appointmentsService,
  leadsService,
  projectsService,
  type Appointment,
  type AppointmentType,
  type Lead,
  type NewAppointment,
  type Project,
} from "@/services"
import { useAuthStore } from "@/stores/auth-store"
import { APPOINTMENT_TYPE_OPTIONS } from "@/lib/appointment-format"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Field, FieldLabel } from "@/components/ui/field"
import { TimePicker } from "@/components/ui/time-picker"
import { Textarea } from "@/components/ui/textarea"
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
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const EMPTY = {
  project_id: "",
  lead_id: "",
  appointment_type: "in_person" as AppointmentType,
  time: "09:00",
  notes: "",
}

/** Combine a picked date and an "HH:mm" string into an ISO timestamp. */
function toIso(date: Date, time: string): string {
  const [hours, minutes] = time.split(":").map(Number)
  const result = new Date(date)
  result.setHours(hours || 0, minutes || 0, 0, 0)
  return result.toISOString()
}

export function CreateAppointmentSheet({
  onCreated,
}: {
  onCreated: (appointment: Appointment) => void
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [saving, setSaving] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [leads, setLeads] = useState<Lead[]>([])

  // Load projects + leads the first time the sheet is opened.
  useEffect(() => {
    if (!open || projects.length) return
    Promise.all([projectsService.list(), leadsService.list()])
      .then(([loadedProjects, loadedLeads]) => {
        setProjects(loadedProjects)
        setLeads(loadedLeads)
      })
      .catch((error) => {
        toast.error(
          error instanceof Error ? error.message : t("appointments.loadFormFailed")
        )
      })
  }, [open, projects.length, t])

  function set<K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  // Only leads belonging to the selected project can be scheduled.
  const projectLeads = useMemo(
    () => leads.filter((lead) => lead.project_id === form.project_id),
    [leads, form.project_id]
  )

  function handleProjectChange(value: string) {
    setForm((prev) => ({ ...prev, project_id: value, lead_id: "" }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.project_id || !form.lead_id || !date || !form.time) {
      toast.error(t("appointments.requiredFields"))
      return
    }
    setSaving(true)
    const payload: NewAppointment = {
      project_id: form.project_id,
      lead_id: form.lead_id,
      advisor_id: useAuthStore.getState().profile?.id ?? null,
      appointment_type: form.appointment_type,
      scheduled_at: toIso(date, form.time),
      notes: form.notes.trim() || null,
    }
    try {
      const appointment = await appointmentsService.create(payload)
      toast.success(t("appointments.appointmentCreated"))
      onCreated(appointment)
      setForm(EMPTY)
      setDate(undefined)
      setOpen(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("appointments.createFailed")
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm">
          <PlusIcon />
          {t("appointments.newAppointment")}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{t("appointments.newAppointment")}</SheetTitle>
          <SheetDescription>
            {t("appointments.newAppointmentDescription")}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 pb-6"
        >
          <Field>
            <FieldLabel htmlFor="appt_project">{t("appointments.project")} *</FieldLabel>
            <Select
              value={form.project_id || undefined}
              onValueChange={handleProjectChange}
            >
              <SelectTrigger id="appt_project" className="w-full">
                <SelectValue placeholder={t("leads.selectProject")} />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-60">
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.project_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="appt_lead">{t("appointments.lead")} *</FieldLabel>
            <Select
              value={form.lead_id || undefined}
              onValueChange={(value) => set("lead_id", value)}
              disabled={!form.project_id}
            >
              <SelectTrigger id="appt_lead" className="w-full">
                <SelectValue
                  placeholder={
                    form.project_id
                      ? t("appointments.selectLead")
                      : t("appointments.selectProjectFirst")
                  }
                />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-60">
                {projectLeads.map((lead) => (
                  <SelectItem key={lead.id} value={lead.id}>
                    {lead.lead_name}
                    {lead.lead_phone ? ` — ${lead.lead_phone}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="appt_type">{t("appointments.type")} *</FieldLabel>
            <Select
              value={form.appointment_type}
              onValueChange={(value) => set("appointment_type", value as AppointmentType)}
            >
              <SelectTrigger id="appt_type" className="w-full">
                <SelectValue placeholder={t("appointments.selectType")} />
              </SelectTrigger>
              <SelectContent>
                {APPOINTMENT_TYPE_OPTIONS.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`appointments.types.${type}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="appt_date">{t("appointments.date")} *</FieldLabel>
            <DatePicker id="appt_date" value={date} onChange={setDate} />
          </Field>

          <Field>
            <FieldLabel htmlFor="appt_time">{t("appointments.hour")} *</FieldLabel>
            <TimePicker
              id="appt_time"
              value={form.time}
              onChange={(value) => set("time", value)}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="appt_notes">{t("appointments.notes")}</FieldLabel>
            <Textarea
              id="appt_notes"
              value={form.notes}
              onChange={(event) => set("notes", event.target.value)}
              placeholder={t("appointments.phNotes")}
            />
          </Field>

          <SheetFooter className="mt-auto px-0">
            <Button type="submit" disabled={saving}>
              {saving ? t("common.creating") : t("appointments.createAppointment")}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
