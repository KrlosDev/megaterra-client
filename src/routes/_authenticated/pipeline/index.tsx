import { useEffect, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { toast } from "sonner"
import { leadsService, type Lead } from "@/services"
import { LEAD_STAGE_ORDER } from "@/lib/lead-format"
import { PipelineBoard } from "@/components/pipeline/pipeline-board"
import { Skeleton } from "@/components/ui/skeleton"

export const Route = createFileRoute("/_authenticated/pipeline/")({
  component: RouteComponent,
})

function RouteComponent() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    leadsService
      .list()
      .then((data) => {
        if (active) setLeads(data)
      })
      .catch((error) => {
        toast.error(
          error instanceof Error ? error.message : "Failed to load leads"
        )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    // Board surface (green→black gradient + tinted topography texture) lives in
    // the `.pipeline-surface` class in index.css, driven by design tokens.
    // Full-bleed: cancel the layout's p-4 (negative margin) and grow to cover it
    // so the background reaches every edge of the content area. Layout untouched.
    // The surface itself does not scroll (so the texture stays put); the inner
    // div is the horizontal scroller for the columns.
    <div className="pipeline-surface -m-4 h-[calc(100%+2rem)] w-[calc(100%+2rem)] overflow-hidden">
      <div className="h-full overflow-x-auto p-4">
        {loading ? (
          <div className="flex h-full gap-3">
            {LEAD_STAGE_ORDER.map((stage) => (
              <div
                key={stage}
                className="flex w-72 shrink-0 flex-col gap-2 rounded-lg bg-card/60 p-2 ring-1 ring-foreground/10 backdrop-blur"
              >
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <PipelineBoard leads={leads} onLeadsChange={setLeads} />
        )}
      </div>
    </div>
  )
}
