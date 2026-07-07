import { useDroppable } from "@dnd-kit/core"
import type { Lead, LeadStage } from "@/services"
import { LEAD_STAGE_LABELS } from "@/lib/lead-format"
import { cn } from "@/lib/utils"
import { PipelineCard } from "./pipeline-card"

type PipelineColumnProps = {
  stage: LeadStage
  leads: Lead[]
}

/** A droppable stage column holding the leads currently in that stage. */
export function PipelineColumn({ stage, leads }: PipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-lg bg-card/60 ring-1 ring-foreground/10 backdrop-blur transition-colors",
        isOver && "ring-2 ring-primary bg-card/80"
      )}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <span className="font-heading text-xs font-medium">
          {LEAD_STAGE_LABELS[stage]}
        </span>
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[0.7rem] font-medium text-muted-foreground">
          {leads.length}
        </span>
      </div>

      <div className="scroll-fade flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto px-2 py-2">
        {leads.length === 0 ? (
          <div className="flex min-h-24 flex-1 items-center justify-center rounded-md border border-dashed border-foreground/10 p-4 text-center text-[0.7rem] text-muted-foreground">
            Drop leads here
          </div>
        ) : (
          leads.map((lead) => <PipelineCard key={lead.id} lead={lead} />)
        )}
      </div>
    </div>
  )
}
