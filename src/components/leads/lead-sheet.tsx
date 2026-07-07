import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  authService,
  leadsService,
  projectsService,
  type Lead,
  type LeadStage,
  type LeadTemperature,
  type NewLead,
  type Profile,
  type Project,
} from "@/services"
import {
  LEAD_STAGE_LABELS,
  LEAD_STAGE_ORDER,
  LEAD_TEMPERATURE_LABELS,
} from "@/lib/lead-format"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
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

const TEMPERATURE_OPTIONS = Object.keys(
  LEAD_TEMPERATURE_LABELS
) as LeadTemperature[]

const advisorName = (profile: Pick<Profile, "display_name" | "email">) =>
  profile.display_name || profile.email

type FormState = {
  lead_name: string
  lead_email: string
  lead_phone: string
  lead_source: string
  project_id: string
  target_interest: string
  budget_min: string
  budget_max: string
  temperature: LeadTemperature | ""
  lead_stage: LeadStage
  advisor_id: string
}

/** Seed the form from an existing lead (edit) or blank (create). */
function initialForm(lead?: Lead, currentUserId?: string): FormState {
  return {
    lead_name: lead?.lead_name ?? "",
    lead_email: lead?.lead_email ?? "",
    lead_phone: lead?.lead_phone ?? "",
    lead_source: lead?.lead_source ?? "",
    project_id: lead?.project_id ?? "",
    target_interest: lead?.target_interest ?? "",
    budget_min: lead?.budget_min != null ? String(lead.budget_min) : "",
    budget_max: lead?.budget_max != null ? String(lead.budget_max) : "",
    temperature: lead?.temperature ?? "",
    lead_stage: lead?.lead_stage ?? "new_lead",
    // New leads default the advisor to the current user; edits keep the lead's.
    advisor_id: lead?.advisor_id ?? currentUserId ?? "",
  }
}

/**
 * Create or edit a lead. Pass a `lead` to edit it, omit it to create.
 * `trigger` opens the sheet; `onSaved` receives the created/updated row.
 */
export function LeadSheet({
  lead,
  trigger,
  onSaved,
}: {
  lead?: Lead
  trigger: React.ReactNode
  onSaved: (lead: Lead) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-xl">
        {/* Remount on each open so the form seeds from the latest lead. */}
        {open && (
          <LeadForm
            lead={lead}
            onSaved={(saved) => {
              onSaved(saved)
              setOpen(false)
            }}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

function LeadForm({
  lead,
  onSaved,
}: {
  lead?: Lead
  onSaved: (lead: Lead) => void
}) {
  const isEdit = Boolean(lead)
  const profile = useAuthStore((state) => state.profile)
  const isAdmin = profile?.role === "admin"

  const [form, setForm] = useState<FormState>(() =>
    initialForm(lead, profile?.id)
  )
  const [saving, setSaving] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [advisors, setAdvisors] = useState<Profile[]>([])

  // Load the project list (and, for admins, the advisor list) on mount.
  useEffect(() => {
    projectsService
      .list()
      .then(setProjects)
      .catch((error) => {
        toast.error(
          error instanceof Error ? error.message : "Failed to load projects"
        )
      })
    if (isAdmin) {
      authService
        .listProfiles()
        .then(setAdvisors)
        .catch((error) => {
          toast.error(
            error instanceof Error ? error.message : "Failed to load advisors"
          )
        })
    }
  }, [isAdmin])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.lead_name.trim()) {
      toast.error("Name is required")
      return
    }
    setSaving(true)
    // Non-admins keep the seeded advisor (self on create); admins may reassign.
    const advisorId = form.advisor_id || profile?.id || null
    const payload: NewLead = {
      lead_name: form.lead_name.trim(),
      lead_email: form.lead_email.trim() || null,
      lead_phone: form.lead_phone.trim() || null,
      lead_source: form.lead_source.trim() || null,
      target_interest: form.target_interest.trim() || null,
      budget_min: form.budget_min.trim() ? Number(form.budget_min) : null,
      budget_max: form.budget_max.trim() ? Number(form.budget_max) : null,
      temperature: form.temperature || null,
      lead_stage: form.lead_stage,
      advisor_id: advisorId,
      project_id: form.project_id || null,
      created_date: lead?.created_date ?? new Date().toISOString(),
    }
    try {
      const saved =
        isEdit && lead
          ? await leadsService.update(lead.id, payload)
          : await leadsService.create(payload)
      toast.success(isEdit ? "Lead updated" : "Lead created")
      onSaved(saved)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : `Failed to ${isEdit ? "update" : "create"} lead`
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>{isEdit ? "Edit lead" : "New lead"}</SheetTitle>
        <SheetDescription>
          {isEdit ? "Update this lead's details." : "Add a lead to the pipeline."}
        </SheetDescription>
      </SheetHeader>

      <form
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 pb-6"
      >
        <Field>
          <FieldLabel htmlFor="lead_name">Name *</FieldLabel>
          <Input
            id="lead_name"
            value={form.lead_name}
            onChange={(event) => set("lead_name", event.target.value)}
            placeholder="Jane Doe"
            required
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="lead_email">Email</FieldLabel>
          <Input
            id="lead_email"
            type="email"
            value={form.lead_email}
            onChange={(event) => set("lead_email", event.target.value)}
            placeholder="jane@example.com"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="lead_phone">Phone</FieldLabel>
          <Input
            id="lead_phone"
            value={form.lead_phone}
            onChange={(event) => set("lead_phone", event.target.value)}
            placeholder="+1 555 123 4567"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="lead_source">Source</FieldLabel>
          <Input
            id="lead_source"
            value={form.lead_source}
            onChange={(event) => set("lead_source", event.target.value)}
            placeholder="Referral, Facebook…"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="project_id">Project</FieldLabel>
          <Select
            value={form.project_id || undefined}
            onValueChange={(value) => set("project_id", value)}
          >
            <SelectTrigger id="project_id" className="w-full">
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
          <FieldLabel htmlFor="target_interest">Interest</FieldLabel>
          <Input
            id="target_interest"
            value={form.target_interest}
            onChange={(event) => set("target_interest", event.target.value)}
            placeholder="2-bedroom apartment"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="budget_min">Budget min</FieldLabel>
            <Input
              id="budget_min"
              type="number"
              min="0"
              step="any"
              value={form.budget_min}
              onChange={(event) => set("budget_min", event.target.value)}
              placeholder="100000"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="budget_max">Budget max</FieldLabel>
            <Input
              id="budget_max"
              type="number"
              min="0"
              step="any"
              value={form.budget_max}
              onChange={(event) => set("budget_max", event.target.value)}
              placeholder="150000"
            />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="temperature">Temperature</FieldLabel>
          <Select
            value={form.temperature || undefined}
            onValueChange={(value) => set("temperature", value as LeadTemperature)}
          >
            <SelectTrigger id="temperature" className="w-full">
              <SelectValue placeholder="Select temperature" />
            </SelectTrigger>
            <SelectContent>
              {TEMPERATURE_OPTIONS.map((temp) => (
                <SelectItem key={temp} value={temp}>
                  {LEAD_TEMPERATURE_LABELS[temp]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor="lead_stage">Stage</FieldLabel>
          <Select
            value={form.lead_stage}
            onValueChange={(value) => set("lead_stage", value as LeadStage)}
          >
            <SelectTrigger id="lead_stage" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" className="max-h-60">
              {LEAD_STAGE_ORDER.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {LEAD_STAGE_LABELS[stage]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {/* Admins can assign any advisor; everyone else is fixed to self. */}
        <Field>
          <FieldLabel htmlFor="advisor_id">Advisor</FieldLabel>
          {isAdmin ? (
            <Select
              value={form.advisor_id || undefined}
              onValueChange={(value) => set("advisor_id", value)}
            >
              <SelectTrigger id="advisor_id" className="w-full">
                <SelectValue placeholder="Select advisor" />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-60">
                {advisors.map((advisor) => (
                  <SelectItem key={advisor.id} value={advisor.id}>
                    {advisorName(advisor)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id="advisor_id"
              value={profile ? advisorName(profile) : ""}
              readOnly
              disabled
            />
          )}
        </Field>

        <SheetFooter className="mt-auto px-0">
          <Button type="submit" disabled={saving}>
            {saving
              ? isEdit
                ? "Saving..."
                : "Creating..."
              : isEdit
                ? "Save changes"
                : "Create lead"}
          </Button>
        </SheetFooter>
      </form>
    </>
  )
}
