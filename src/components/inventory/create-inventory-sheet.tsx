import { useEffect, useState } from "react"
import { PlusIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
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
  const { t } = useTranslation()
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
          error instanceof Error ? error.message : t("leads.loadProjectsFailed")
        )
      })
  }, [open, projects.length, t])

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
      toast.error(t("inventory.requiredFields"))
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
      toast.success(t("inventory.unitCreated"))
      onCreated(unit)
      setForm(EMPTY)
      setOpen(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("inventory.createFailed")
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
          {t("inventory.newUnit")}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{t("inventory.newUnit")}</SheetTitle>
          <SheetDescription>
            {t("inventory.newUnitDescription")}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 pb-6"
        >
          <Field>
            <FieldLabel htmlFor="project_id">{t("inventory.project")} *</FieldLabel>
            <Select
              value={form.project_id || undefined}
              onValueChange={(value) => set("project_id", value)}
            >
              <SelectTrigger id="project_id" className="w-full">
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
            <FieldLabel htmlFor="unit">{t("inventory.unit")} *</FieldLabel>
            <Input
              id="unit"
              value={form.unit}
              onChange={(event) => set("unit", event.target.value)}
              placeholder="U-101"
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="unit_type">{t("inventory.type")}</FieldLabel>
            <Select
              value={form.unit_type || undefined}
              onValueChange={(value) => set("unit_type", value as UnitType)}
            >
              <SelectTrigger id="unit_type" className="w-full">
                <SelectValue placeholder={t("inventory.selectType")} />
              </SelectTrigger>
              <SelectContent>
                {UNIT_TYPE_OPTIONS.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`inventory.unitTypes.${type}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="unit_floor">{t("inventory.floor")}</FieldLabel>
            <Input
              id="unit_floor"
              value={form.unit_floor}
              onChange={(event) => set("unit_floor", event.target.value)}
              placeholder={t("inventory.phFloor")}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="unit_size">
              {t("inventory.size")}{sizeUnit ? ` (${sizeUnit})` : ""}
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
              {t("inventory.price")}{selectedProject?.currency ? ` (${selectedProject.currency})` : ""}
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
            <FieldLabel htmlFor="status">{t("common.status")} *</FieldLabel>
            <Select
              value={form.status || undefined}
              onValueChange={(value) => set("status", value as InventoryStatus)}
            >
              <SelectTrigger id="status" className="w-full">
                <SelectValue placeholder={t("inventory.selectStatus")} />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {t(`inventory.statuses.${status}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="unit_description">
              {t("inventory.description")}
            </FieldLabel>
            <Textarea
              id="unit_description"
              value={form.unit_description}
              onChange={(event) => set("unit_description", event.target.value)}
              placeholder={t("inventory.phDescription")}
            />
          </Field>

          <SheetFooter className="mt-auto px-0">
            <Button type="submit" disabled={saving}>
              {saving ? t("common.creating") : t("inventory.createUnit")}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
