import { useEffect, useMemo, useState } from "react"
import { PlusIcon } from "lucide-react"
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
import {
  APPOINTMENT_TYPE_LABELS,
  APPOINTMENT_TYPE_OPTIONS,
} from "@/lib/appointment-format"
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
          error instanceof Error ? error.message : "Failed to load form data"
        )
      })
  }, [open, projects.length])

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
      toast.error("Project, lead, date and time are required")
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
      toast.success("Appointment created")
      onCreated(appointment)
      setForm(EMPTY)
      setDate(undefined)
      setOpen(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create appointment"
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
          New appointment
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>New appointment</SheetTitle>
          <SheetDescription>
            Schedule a lead visit or meeting for a project.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 pb-6"
        >
          <Field>
            <FieldLabel htmlFor="appt_project">Project *</FieldLabel>
            <Select
              value={form.project_id || undefined}
              onValueChange={handleProjectChange}
            >
              <SelectTrigger id="appt_project" className="w-full">
                <SelectValue placeholder="Select project" />
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
            <FieldLabel htmlFor="appt_lead">Lead *</FieldLabel>
            <Select
              value={form.lead_id || undefined}
              onValueChange={(value) => set("lead_id", value)}
              disabled={!form.project_id}
            >
              <SelectTrigger id="appt_lead" className="w-full">
                <SelectValue
                  placeholder={
                    form.project_id ? "Select lead" : "Select a project first"
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
            <FieldLabel htmlFor="appt_type">Type *</FieldLabel>
            <Select
              value={form.appointment_type}
              onValueChange={(value) => set("appointment_type", value as AppointmentType)}
            >
              <SelectTrigger id="appt_type" className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {APPOINTMENT_TYPE_OPTIONS.map((type) => (
                  <SelectItem key={type} value={type}>
                    {APPOINTMENT_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="appt_date">Date *</FieldLabel>
            <DatePicker id="appt_date" value={date} onChange={setDate} />
          </Field>

          <Field>
            <FieldLabel htmlFor="appt_time">Hour *</FieldLabel>
            <TimePicker
              id="appt_time"
              value={form.time}
              onChange={(value) => set("time", value)}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="appt_notes">Notes</FieldLabel>
            <Textarea
              id="appt_notes"
              value={form.notes}
              onChange={(event) => set("notes", event.target.value)}
              placeholder="Anything to remember about this appointment"
            />
          </Field>

          <SheetFooter className="mt-auto px-0">
            <Button type="submit" disabled={saving}>
              {saving ? "Creating..." : "Create appointment"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
