import { useEffect, useMemo, useState } from "react"
import { CalculatorIcon, DownloadIcon, SendIcon } from "lucide-react"
import { toast } from "sonner"
import {
  inventoryService,
  leadsService,
  projectsService,
  quotesService,
  type InventoryUnit,
  type Lead,
  type Project,
} from "@/services"
import { formatPrice, formatSize } from "@/lib/inventory-format"
import { downloadQuotePdf } from "@/lib/quote-pdf"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
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
  SheetTrigger,
} from "@/components/ui/sheet"

function unitLabel(unit: InventoryUnit): string {
  const size = formatSize(unit.unit_size, unit.project?.size_type ?? null)
  const price = formatPrice(unit.price, unit.project?.currency ?? null)
  return `${unit.unit} — ${size} — ${price}`
}

export function QuoterSheet({
  open: openProp,
  onOpenChange,
  initialUnit,
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  initialUnit?: InventoryUnit
} = {}) {
  // Controlled when `open` is provided; otherwise manage state internally
  // (the header usage renders its own calculator trigger).
  const controlled = openProp !== undefined
  const [openState, setOpenState] = useState(false)
  const open = controlled ? openProp : openState
  const setOpen = (value: boolean) => {
    if (!controlled) setOpenState(value)
    onOpenChange?.(value)
  }

  const profile = useAuthStore((state) => state.profile)

  const [projects, setProjects] = useState<Project[]>([])
  const [units, setUnits] = useState<InventoryUnit[]>([])
  const [leads, setLeads] = useState<Lead[]>([])

  const [leadId, setLeadId] = useState("")
  const [client, setClient] = useState("")
  const [projectId, setProjectId] = useState("")
  const [unitId, setUnitId] = useState("")
  const [downPct, setDownPct] = useState(10)
  const [years, setYears] = useState(20)
  const [rate, setRate] = useState(9.5)
  const [saving, setSaving] = useState(false)

  // Load projects + units + leads the first time the sheet is opened.
  useEffect(() => {
    if (!open || projects.length) return
    Promise.all([
      projectsService.list(),
      inventoryService.list(),
      leadsService.list(),
    ])
      .then(([loadedProjects, loadedUnits, loadedLeads]) => {
        setProjects(loadedProjects)
        setUnits(loadedUnits)
        setLeads(loadedLeads)
      })
      .catch((error) => {
        toast.error(
          error instanceof Error ? error.message : "Failed to load quoter data"
        )
      })
  }, [open, projects.length])

  // When opened with a pre-selected unit (e.g. the "Quote" action on an
  // inventory row), fill in its project + unit once the lists have loaded.
  useEffect(() => {
    if (!open || !initialUnit || !units.length) return
    setProjectId(initialUnit.project_id)
    setUnitId(initialUnit.id)
  }, [open, initialUnit, units.length])

  const selectedProject =
    projects.find((project) => project.id === projectId) ?? null
  const currency = selectedProject?.currency ?? null
  const projectUnits = useMemo(
    () => units.filter((unit) => unit.project_id === projectId),
    [units, projectId]
  )
  const selectedUnit =
    projectUnits.find((unit) => unit.id === unitId) ?? null

  // Financing math (standard amortization).
  const price = selectedUnit?.price ? Number(selectedUnit.price) : 0
  const downAmount = (price * downPct) / 100
  const financed = price - downAmount
  const months = Math.max(1, Math.round(years * 12))
  const monthlyRate = rate / 100 / 12
  const monthly =
    financed <= 0
      ? 0
      : monthlyRate === 0
        ? financed / months
        : (financed * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months))
  const total = downAmount + monthly * months

  function handleProjectChange(value: string) {
    setProjectId(value)
    setUnitId("")
  }

  // Selecting a lead prefills the client name and (when set) its project.
  // Both remain editable afterwards.
  function handleLeadChange(value: string) {
    setLeadId(value)
    const lead = leads.find((candidate) => candidate.id === value)
    if (!lead) return
    setClient(lead.lead_name)
    if (lead.project_id) handleProjectChange(lead.project_id)
  }

  async function handleDownload() {
    if (!selectedUnit) {
      toast.error("Select a unit first")
      return
    }
    downloadQuotePdf({
      client,
      projectName: selectedProject?.project_name ?? "",
      unitLabel: unitLabel(selectedUnit),
      currency,
      price,
      downPct,
      downAmount,
      financed,
      years,
      months,
      rate,
      monthly,
      total,
    })

    // Record the quote. The PDF has already downloaded, so a save failure only
    // warns — it never blocks the user's document.
    setSaving(true)
    try {
      await quotesService.create({
        lead_id: leadId || null,
        project_id: projectId || null,
        unit_id: unitId || null,
        client_name: client.trim() || null,
        currency,
        price,
        down_pct: downPct,
        down_amount: downAmount,
        financed,
        term_years: years,
        term_months: months,
        interest_rate: rate,
        monthly_payment: monthly,
        total,
        advisor_id: profile?.id ?? null,
      })
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to record quote"
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {!controlled && (
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Open quoter">
            <CalculatorIcon className="size-4" />
            <span className="sr-only">Quoter</span>
          </Button>
        </SheetTrigger>
      )}
      <SheetContent
        side="right"
        className="data-[side=right]:w-full data-[side=right]:sm:max-w-lg"
      >
        <SheetHeader>
          <SheetTitle>Quoter</SheetTitle>
          <SheetDescription>
            Estimate a financing plan for a unit.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 pb-6">
          <Field>
            <FieldLabel htmlFor="quote_lead">Lead</FieldLabel>
            <Select value={leadId || undefined} onValueChange={handleLeadChange}>
              <SelectTrigger id="quote_lead" className="w-full">
                <SelectValue placeholder="No lead (one-off quote)" />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-60">
                {leads.map((lead) => (
                  <SelectItem key={lead.id} value={lead.id}>
                    {lead.lead_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="quote_client">Client</FieldLabel>
            <Input
              id="quote_client"
              value={client}
              onChange={(event) => setClient(event.target.value)}
              placeholder="Client name"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="quote_project">Project</FieldLabel>
            <Select value={projectId || undefined} onValueChange={handleProjectChange}>
              <SelectTrigger id="quote_project" className="w-full">
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
            <FieldLabel htmlFor="quote_unit">Unit</FieldLabel>
            <Select
              value={unitId || undefined}
              onValueChange={setUnitId}
              disabled={!projectId}
            >
              <SelectTrigger id="quote_unit" className="w-full">
                <SelectValue
                  placeholder={projectId ? "Select unit" : "Select a project first"}
                />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-60">
                {projectUnits.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unitLabel(unit)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="quote_down">Down payment</FieldLabel>
              <span className="text-xs font-medium text-primary">
                {downPct}% — {formatPrice(downAmount, currency)}
              </span>
            </div>
            <Slider
              id="quote_down"
              min={5}
              max={50}
              step={1}
              value={[downPct]}
              onValueChange={([value]) => setDownPct(value)}
            />
            <div className="flex justify-between text-[0.625rem] text-muted-foreground">
              <span>5%</span>
              <span>50%</span>
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="quote_years">Term (years)</FieldLabel>
              <Input
                id="quote_years"
                type="number"
                min="1"
                max="40"
                value={years}
                onChange={(event) => setYears(Number(event.target.value) || 0)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="quote_rate">Interest rate (% annual)</FieldLabel>
              <Input
                id="quote_rate"
                type="number"
                min="0"
                step="0.1"
                value={rate}
                onChange={(event) => setRate(Number(event.target.value) || 0)}
              />
            </Field>
          </div>

          {/* Summary */}
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-3 text-sm font-medium">Summary</h3>
            <dl className="flex flex-col gap-2 text-xs">
              <SummaryRow label="Unit price" value={formatPrice(price, currency)} />
              <SummaryRow
                label="Down payment"
                value={formatPrice(downAmount, currency)}
              />
              <SummaryRow
                label="Amount to finance"
                value={formatPrice(financed, currency)}
              />
              <SummaryRow
                label="Term"
                value={`${years} years (${months} months)`}
              />
              <SummaryRow label="Rate" value={`${rate}% annual`} />
            </dl>

            <div className="mt-4 rounded-md bg-primary/10 p-3">
              <div className="text-xs text-muted-foreground">
                Estimated monthly payment
              </div>
              <div className="text-2xl font-bold text-primary">
                {formatPrice(monthly, currency)}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Total to pay</span>
              <span className="font-medium">{formatPrice(total, currency)}</span>
            </div>
          </div>

          <div className="mt-2 flex flex-col gap-2">
            <Button onClick={handleDownload} disabled={!selectedUnit || saving}>
              <DownloadIcon />
              {saving ? "Saving…" : "Download PDF"}
            </Button>
            {/* WhatsApp sending is a later step. */}
            <Button variant="outline" disabled>
              <SendIcon />
              Send via WhatsApp
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}
