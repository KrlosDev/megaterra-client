import { useState } from "react"
import { CountrySelect } from "react-country-state-city"
import "react-country-state-city/dist/react-country-state-city.css"
import { toast } from "sonner"
import {
  projectsService,
  type NewProject,
  type Project,
  type ProjectStatus,
  type SizeType,
} from "@/services"
import { PROJECT_STATUS_LABELS, SIZE_TYPE_LABELS } from "@/lib/project-format"
import { CURRENCIES, currencyLabel } from "@/lib/currencies"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
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

const STATUS_OPTIONS = Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]
const SIZE_TYPE_OPTIONS = Object.keys(SIZE_TYPE_LABELS) as SizeType[]

type FormState = {
  project_name: string
  project_status: ProjectStatus | ""
  country: string
  currency: string
  size_type: SizeType | ""
  address: string
  project_description: string
  inventory_description: string
}

/** Seed the form from an existing project (edit) or blank (create). */
function initialForm(project?: Project): FormState {
  return {
    project_name: project?.project_name ?? "",
    project_status: project?.project_status ?? "",
    country: project?.country ?? "",
    currency: project?.currency ?? "",
    size_type: project?.size_type ?? "",
    address: project?.address ?? "",
    project_description: project?.project_description ?? "",
    inventory_description: project?.inventory_description ?? "",
  }
}

/**
 * Create or edit a project. Pass a `project` to edit it, omit it to create.
 * `trigger` is the element that opens the sheet; `onSaved` receives the
 * created/updated row. Writes are admin-only (enforced by RLS).
 */
export function ProjectSheet({
  project,
  trigger,
  onSaved,
}: {
  project?: Project
  trigger: React.ReactNode
  onSaved: (project: Project) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-xl">
        {/* Remount on each open so the form seeds from the latest project. */}
        {open && (
          <ProjectForm
            project={project}
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

function ProjectForm({
  project,
  onSaved,
}: {
  project?: Project
  onSaved: (project: Project) => void
}) {
  const isEdit = Boolean(project)
  const [form, setForm] = useState<FormState>(() => initialForm(project))
  const [saving, setSaving] = useState(false)

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  // Currency codes to offer: the curated list, plus the current value if it was
  // auto-filled from a country outside that list (so it stays selectable).
  const currencyCodes = CURRENCIES.map((currency) => currency.code)
  const currencyOptions =
    form.currency && !currencyCodes.includes(form.currency)
      ? [form.currency, ...currencyCodes]
      : currencyCodes

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.project_name.trim() || !form.project_status) {
      toast.error("Name and status are required")
      return
    }
    setSaving(true)
    const payload: NewProject = {
      project_name: form.project_name.trim(),
      project_status: form.project_status,
      country: form.country || null,
      currency: form.currency.trim() || null,
      size_type: form.size_type || null,
      address: form.address.trim() || null,
      project_description: form.project_description.trim() || null,
      inventory_description: form.inventory_description.trim() || null,
    }
    try {
      const saved =
        isEdit && project
          ? await projectsService.update(project.id, payload)
          : await projectsService.create(payload)
      toast.success(isEdit ? "Project updated" : "Project created")
      onSaved(saved)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : `Failed to ${isEdit ? "update" : "create"} project`
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>{isEdit ? "Edit project" : "New project"}</SheetTitle>
        <SheetDescription>
          {isEdit
            ? "Update this project's details."
            : "Add a real estate project to the portfolio."}
        </SheetDescription>
      </SheetHeader>

      <form
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 pb-6"
      >
        <Field>
          <FieldLabel htmlFor="project_name">Name *</FieldLabel>
          <Input
            id="project_name"
            value={form.project_name}
            onChange={(event) => set("project_name", event.target.value)}
            required
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="project_status">Status *</FieldLabel>
          <Select
            value={form.project_status || undefined}
            onValueChange={(value) => set("project_status", value as ProjectStatus)}
          >
            <SelectTrigger id="project_status" className="w-full">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {PROJECT_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel>Country</FieldLabel>
          <CountrySelect
            containerClassName="w-full"
            inputClassName="w-full"
            placeHolder={form.country || "Select country"}
            onChange={(country) => {
              // onChange is typed as ChangeEvent | Country; narrow to Country.
              if (!("name" in country)) return
              set("country", country.name)
              // Auto-fill currency from the selected country (editable).
              if (country.currency) set("currency", country.currency)
            }}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="currency">Currency</FieldLabel>
          <Select
            value={form.currency || undefined}
            onValueChange={(value) => set("currency", value)}
          >
            <SelectTrigger id="currency" className="w-full">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent position="popper" className="max-h-60">
              {currencyOptions.map((code) => (
                <SelectItem key={code} value={code}>
                  {currencyLabel(code)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor="size_type">Size unit</FieldLabel>
          <Select
            value={form.size_type || undefined}
            onValueChange={(value) => set("size_type", value as SizeType)}
          >
            <SelectTrigger id="size_type" className="w-full">
              <SelectValue placeholder="Select size unit" />
            </SelectTrigger>
            <SelectContent>
              {SIZE_TYPE_OPTIONS.map((unit) => (
                <SelectItem key={unit} value={unit}>
                  {SIZE_TYPE_LABELS[unit]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor="address">Address</FieldLabel>
          <Input
            id="address"
            value={form.address}
            onChange={(event) => set("address", event.target.value)}
            placeholder="Av. Balboa, Panama City"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="project_description">Description</FieldLabel>
          <Textarea
            id="project_description"
            value={form.project_description}
            onChange={(event) => set("project_description", event.target.value)}
            placeholder="Beachfront pre-sale condos with early-buyer pricing."
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="inventory_description">
            Inventory description
          </FieldLabel>
          <Textarea
            id="inventory_description"
            value={form.inventory_description}
            onChange={(event) => set("inventory_description", event.target.value)}
            placeholder="Apartments, 2-3 bedrooms"
          />
        </Field>

        <SheetFooter className="mt-auto px-0">
          <Button type="submit" disabled={saving}>
            {saving
              ? isEdit
                ? "Saving..."
                : "Creating..."
              : isEdit
                ? "Save changes"
                : "Create project"}
          </Button>
        </SheetFooter>
      </form>
    </>
  )
}
