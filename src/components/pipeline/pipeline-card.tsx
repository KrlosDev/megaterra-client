import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import type { Lead } from "@/services"
import { formatBudgetCompact } from "@/lib/lead-format"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

type PipelineCardProps = {
  lead: Lead
  /** Rendered inside the DragOverlay — skips drag wiring, shows a lifted state. */
  overlay?: boolean
}

/** A single lead on the pipeline board. Draggable between stage columns. */
export function PipelineCard({ lead, overlay = false }: PipelineCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: lead.id, data: { stage: lead.lead_stage } })

  const budget = formatBudgetCompact(
    lead.budget_min,
    lead.budget_max,
    lead.project?.currency ?? null
  )

  return (
    <Card
      ref={setNodeRef}
      size="sm"
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(
        // shrink-0 keeps every card the same height when the column overflows.
        "shrink-0 cursor-grab gap-2 py-3 select-none active:cursor-grabbing",
        // Hide the original while its overlay clone is being dragged.
        isDragging && "opacity-40",
        overlay && "cursor-grabbing shadow-lg ring-primary"
      )}
      {...listeners}
      {...attributes}
    >
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <span className="min-w-0 truncate font-heading text-sm font-medium leading-tight">
            {lead.lead_name}
          </span>
          <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
        </div>
        <span className="text-xs text-muted-foreground">
          {lead.project?.project_name ?? "—"}
        </span>
        <div className="mt-1 flex items-baseline justify-between gap-2">
          <span className="text-sm font-semibold">{budget}</span>
          <span className="text-xs text-muted-foreground">
            {lead.lead_source ?? "—"}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
