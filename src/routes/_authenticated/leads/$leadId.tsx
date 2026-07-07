import { useEffect, useState } from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { format, formatDistanceToNow } from "date-fns"
import {
  ArrowLeftIcon,
  CalculatorIcon,
  CalendarIcon,
  ClockIcon,
  PencilIcon,
  PhoneIcon,
  StickyNoteIcon,
  UserXIcon,
} from "lucide-react"
import { toast } from "sonner"
import {
  appointmentsService,
  leadsService,
  notesService,
  quotesService,
  type Appointment,
  type Lead,
  type LeadNote,
  type LeadStage,
  type Quote,
} from "@/services"
import {
  LEAD_STAGE_LABELS,
  LEAD_STAGE_ORDER,
  LEAD_TEMPERATURE_LABELS,
  LEAD_TEMPERATURE_VARIANTS,
  formatBudget,
} from "@/lib/lead-format"
import { formatPrice } from "@/lib/inventory-format"
import { APPOINTMENT_TYPE_LABELS } from "@/lib/appointment-format"
import { usePageTitleStore } from "@/stores/page-title-store"
import { LeadSheet } from "@/components/leads/lead-sheet"
import { AppointmentStatusBadge } from "@/components/appointments/appointment-status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const Route = createFileRoute("/_authenticated/leads/$leadId")({
  component: RouteComponent,
})

function RouteComponent() {
  const { leadId } = Route.useParams()
  const [lead, setLead] = useState<Lead | null>(null)
  const [notes, setNotes] = useState<LeadNote[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.all([
      leadsService.get(leadId),
      notesService.listByLead(leadId),
      quotesService.listByLead(leadId),
      appointmentsService.list(),
    ])
      .then(([loadedLead, loadedNotes, loadedQuotes, loadedAppointments]) => {
        if (!active) return
        setLead(loadedLead)
        setNotes(loadedNotes)
        setQuotes(loadedQuotes)
        setAppointments(
          loadedAppointments.filter(
            (appointment) => appointment.lead_id === leadId
          )
        )
      })
      .catch((error) => {
        toast.error(
          error instanceof Error ? error.message : "Failed to load lead"
        )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [leadId])

  // Show the lead name in the header instead of the id slug.
  const setTitleOverride = usePageTitleStore((state) => state.setOverride)
  useEffect(() => {
    setTitleOverride(lead?.lead_name ?? null)
    return () => setTitleOverride(null)
  }, [lead?.lead_name, setTitleOverride])

  // Change the pipeline stage optimistically, reverting on failure.
  function handleStageChange(nextStage: LeadStage) {
    if (!lead || lead.lead_stage === nextStage) return
    const previous = lead.lead_stage
    setLead({ ...lead, lead_stage: nextStage })
    leadsService.updateStage(lead.id, nextStage).catch((error) => {
      setLead((current) =>
        current ? { ...current, lead_stage: previous } : current
      )
      toast.error(
        error instanceof Error ? error.message : "Failed to update stage"
      )
    })
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink />
        <EmptyState icon={<UserXIcon />} title="Lead not found." />
      </div>
    )
  }

  const advisor = lead.advisor?.display_name || lead.advisor?.email || null

  return (
    <div className="flex flex-col gap-4">
      <BackLink />

      {/* Header card */}
      <div className="rounded-2xl border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{lead.lead_name}</h1>
              {lead.temperature && (
                <Badge variant={LEAD_TEMPERATURE_VARIANTS[lead.temperature]}>
                  {LEAD_TEMPERATURE_LABELS[lead.temperature]}
                </Badge>
              )}
            </div>
            {lead.lead_phone && (
              <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <PhoneIcon className="size-4" />
                {lead.lead_phone}
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
              <Meta label="Project" value={lead.project?.project_name ?? null} />
              <Meta label="Advisor" value={advisor} />
              <Meta label="Source" value={lead.lead_source} />
              <Meta
                label="Budget"
                value={formatBudget(
                  lead.budget_min,
                  lead.budget_max,
                  lead.project?.currency ?? null
                )}
              />
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            <LeadSheet
              lead={lead}
              onSaved={setLead}
              trigger={
                <Button variant="outline" size="sm">
                  <PencilIcon />
                  Edit
                </Button>
              }
            />
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Stage
              </span>
              <Select value={lead.lead_stage} onValueChange={handleStageChange}>
                <SelectTrigger className="w-56">
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
            </div>
          </div>
        </div>
      </div>

      {/* Notes + Appointments */}
      <div className="grid gap-4 lg:grid-cols-2">
        <NotesCard leadId={lead.id} notes={notes} onNotesChange={setNotes} />

        <div className="rounded-xl border bg-card">
          <h2 className="flex items-center gap-2 p-5 pb-2 text-lg font-semibold">
            <CalendarIcon className="size-5 text-primary" />
            Appointments
          </h2>
          {appointments.length === 0 ? (
            <EmptyState
              icon={<CalendarIcon />}
              title="No appointments for this lead."
            />
          ) : (
            <ul>
              {appointments.map((appointment) => (
                <li
                  key={appointment.id}
                  className="flex items-center justify-between gap-3 border-t px-5 py-3"
                >
                  <div className="flex items-center gap-3">
                    <ClockIcon className="size-4 text-muted-foreground" />
                    <span className="text-sm">
                      {format(
                        new Date(appointment.scheduled_at),
                        "MMM d · HH:mm"
                      )}{" "}
                      · {APPOINTMENT_TYPE_LABELS[appointment.appointment_type]}
                    </span>
                  </div>
                  <AppointmentStatusBadge status={appointment.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Quotes */}
      <div className="rounded-xl border bg-card">
        <h2 className="p-5 pb-2 text-lg font-semibold">Quotes</h2>
        {quotes.length === 0 ? (
          <EmptyState
            icon={<CalculatorIcon />}
            title="No quotes for this lead."
          />
        ) : (
          <ul>
            {quotes.map((quote) => (
              <li
                key={quote.id}
                className="flex items-center justify-between gap-3 border-t px-5 py-3"
              >
                <div>
                  <div className="font-medium">
                    {formatPrice(quote.monthly_payment, quote.currency)}/mo
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatPrice(quote.total, quote.currency)} total ·{" "}
                    {format(new Date(quote.created_at), "MMM d, yyyy")}
                  </div>
                </div>
                <Badge variant={quote.sent ? "default" : "outline"}>
                  {quote.sent ? "Sent" : "Not sent"}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function NotesCard({
  leadId,
  notes,
  onNotesChange,
}: {
  leadId: string
  notes: LeadNote[]
  onNotesChange: (updater: (prev: LeadNote[]) => LeadNote[]) => void
}) {
  const [draft, setDraft] = useState("")
  const [saving, setSaving] = useState(false)

  async function handleAdd() {
    const note = draft.trim()
    if (!note) return
    setSaving(true)
    try {
      const created = await notesService.create({ lead_id: leadId, note })
      onNotesChange((prev) => [created, ...prev])
      setDraft("")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add note"
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border bg-card">
      <h2 className="p-5 pb-3 text-lg font-semibold">Notes</h2>
      <div className="flex flex-col gap-2 px-5">
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Write a note…"
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={handleAdd} disabled={saving || !draft.trim()}>
            {saving ? "Adding…" : "Add note"}
          </Button>
        </div>
      </div>
      {notes.length === 0 ? (
        <EmptyState icon={<StickyNoteIcon />} title="No notes yet." />
      ) : (
        <ul className="mt-3">
          {notes.map((note) => (
            <li key={note.id} className="border-t px-5 py-3">
              <p className="whitespace-pre-wrap text-sm">{note.note}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(note.created_at), {
                  addSuffix: true,
                })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function BackLink() {
  return (
    <Link
      to="/leads"
      className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-primary hover:underline"
    >
      <ArrowLeftIcon className="size-4" />
      Leads
    </Link>
  )
}

function Meta({ label, value }: { label: string; value: string | null }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{value || "—"}</span>
    </span>
  )
}

function EmptyState({
  icon,
  title,
}: {
  icon: React.ReactNode
  title: string
}) {
  return (
    <Empty className="border-0 py-10">
      <EmptyHeader>
        <EmptyMedia variant="icon">{icon}</EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
      </EmptyHeader>
    </Empty>
  )
}
