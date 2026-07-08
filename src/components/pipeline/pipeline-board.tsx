import { useMemo, useState } from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { leadsService, type Lead, type LeadStage } from "@/services"
import { LEAD_STAGE_ORDER } from "@/lib/lead-format"
import { PipelineColumn } from "./pipeline-column"
import { PipelineCard } from "./pipeline-card"

type PipelineBoardProps = {
  leads: Lead[]
  onLeadsChange: (updater: (prev: Lead[]) => Lead[]) => void
}

/** Kanban board: one column per lead stage, drag a card to change its stage. */
export function PipelineBoard({ leads, onLeadsChange }: PipelineBoardProps) {
  const { t } = useTranslation()
  const [activeId, setActiveId] = useState<string | null>(null)

  // A small activation distance so clicks don't register as drags.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  // Bucket leads by stage for O(n) column rendering.
  const leadsByStage = useMemo(() => {
    const buckets = new Map<LeadStage, Lead[]>()
    for (const stage of LEAD_STAGE_ORDER) buckets.set(stage, [])
    for (const lead of leads) buckets.get(lead.lead_stage)?.push(lead)
    return buckets
  }, [leads])

  const activeLead = activeId
    ? leads.find((lead) => lead.id === activeId) ?? null
    : null

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id))
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    if (!over) return

    const leadId = String(active.id)
    const nextStage = over.id as LeadStage
    const lead = leads.find((l) => l.id === leadId)
    if (!lead || lead.lead_stage === nextStage) return

    const prevStage = lead.lead_stage
    // Optimistically move the card.
    onLeadsChange((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, lead_stage: nextStage } : l))
    )

    leadsService.updateStage(leadId, nextStage).catch((error) => {
      // Revert on failure.
      onLeadsChange((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, lead_stage: prevStage } : l))
      )
      toast.error(
        error instanceof Error ? error.message : t("pipeline.moveFailed")
      )
    })
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full gap-3">
        {LEAD_STAGE_ORDER.map((stage) => (
          <PipelineColumn
            key={stage}
            stage={stage}
            leads={leadsByStage.get(stage) ?? []}
          />
        ))}
      </div>

      <DragOverlay>
        {activeLead ? <PipelineCard lead={activeLead} overlay /> : null}
      </DragOverlay>
    </DndContext>
  )
}
