import { useEffect, useState } from "react"
import { PlusIcon } from "lucide-react"
import { toast } from "sonner"
import {
  inventoryService,
  projectsService,
  type InventoryStatus,
  type InventoryUnit,
  type NewInventoryUnit,
  type Project,
  type UnitType,
} from "@/services"
import { SIZE_TYPE_LABELS } from "@/lib/project-format"
import {
  INVENTORY_STATUS_LABELS,
  UNIT_TYPE_LABELS,
} from "@/lib/inventory-format"
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

const STATUS_OPTIONS = Object.keys(INVENTORY_STATUS_LABELS) as InventoryStatus[]
const UNIT_TYPE_OPTIONS = Object.keys(UNIT_TYPE_LABELS) as UnitType[]

const EMPTY = {
  project_id: "",
  unit: "",
  unit_type: "" as UnitType | "",
  unit_floor: "",
  unit_description: "",
  unit_size: "",
  price: "",
  status: "" as InventoryStatus | "",
}

export function CreateInventorySheet({
  onCreated,
}: {
  onCreated: (unit: InventoryUnit) => void
}) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])

  // Load the project list the first time the sheet is opened.
  useEffect(() => {
    if (!open || projects.length) return
    projectsService
      .list()
      .then(setProjects)
      .catch((error) => {
        toast.error(
          error instanceof Error ? error.message : "Failed to load projects"
        )
      })
  }, [open, projects.length])

  function set<K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const selectedProject =
    projects.find((project) => project.id === form.project_id) ?? null
  const sizeUnit = selectedProject?.size_type
    ? SIZE_TYPE_LABELS[selectedProject.size_type]
    : null

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.project_id || !form.unit.trim() || !form.status) {
      toast.error("Project, unit and status are required")
      return
    }
    setSaving(true)
    const payload: NewInventoryUnit = {
      project_id: form.project_id,
      unit: form.unit.trim(),
      unit_type: form.unit_type || null,
      unit_floor: form.unit_floor.trim() || null,
      unit_description: form.unit_description.trim() || null,
      unit_size: form.unit_size.trim() ? Number(form.unit_size) : null,
      price: form.price.trim() ? Number(form.price) : null,
      status: form.status,
    }
    try {
      const unit = await inventoryService.create(payload)
      toast.success("Unit created")
      onCreated(unit)
      setForm(EMPTY)
      setOpen(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create unit"
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
          New unit
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>New unit</SheetTitle>
          <SheetDescription>
            Add a single inventory unit to a project.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 pb-6"
        >
          <Field>
            <FieldLabel htmlFor="project_id">Project *</FieldLabel>
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
            <FieldLabel htmlFor="unit">Unit *</FieldLabel>
            <Input
              id="unit"
              value={form.unit}
              onChange={(event) => set("unit", event.target.value)}
              placeholder="U-101"
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="unit_type">Type</FieldLabel>
            <Select
              value={form.unit_type || undefined}
              onValueChange={(value) => set("unit_type", value as UnitType)}
            >
              <SelectTrigger id="unit_type" className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {UNIT_TYPE_OPTIONS.map((type) => (
                  <SelectItem key={type} value={type}>
                    {UNIT_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="unit_floor">Floor</FieldLabel>
            <Input
              id="unit_floor"
              value={form.unit_floor}
              onChange={(event) => set("unit_floor", event.target.value)}
              placeholder="e.g. 3 or E1"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="unit_size">
              Size{sizeUnit ? ` (${sizeUnit})` : ""}
            </FieldLabel>
            <Input
              id="unit_size"
              type="number"
              min="0"
              step="any"
              value={form.unit_size}
              onChange={(event) => set("unit_size", event.target.value)}
              placeholder="72"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="price">
              Price{selectedProject?.currency ? ` (${selectedProject.currency})` : ""}
            </FieldLabel>
            <Input
              id="price"
              type="number"
              min="0"
              step="any"
              value={form.price}
              onChange={(event) => set("price", event.target.value)}
              placeholder="120000"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="status">Status *</FieldLabel>
            <Select
              value={form.status || undefined}
              onValueChange={(value) => set("status", value as InventoryStatus)}
            >
              <SelectTrigger id="status" className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {INVENTORY_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="unit_description">Description</FieldLabel>
            <Textarea
              id="unit_description"
              value={form.unit_description}
              onChange={(event) => set("unit_description", event.target.value)}
              placeholder="Corner unit with balcony"
            />
          </Field>

          <SheetFooter className="mt-auto px-0">
            <Button type="submit" disabled={saving}>
              {saving ? "Creating..." : "Create unit"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
