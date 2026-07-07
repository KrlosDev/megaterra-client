import { useEffect, useMemo, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { PlusIcon } from "lucide-react"
import { toast } from "sonner"
import {
  appointmentsService,
  inventoryService,
  leadsService,
  projectsService,
  type Appointment,
  type InventoryUnit,
  type Lead,
  type Project,
} from "@/services"
import { useAuthStore } from "@/stores/auth-store"
import { HeaderSlot } from "@/components/layout/header-slot"
import { ProjectSheet } from "@/components/projects/project-sheet"
import {
  ProjectCard,
  type ProjectStats,
} from "@/components/projects/project-card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export const Route = createFileRoute("/_authenticated/projects/")({
  component: RouteComponent,
})

/** Derive per-project card figures from inventory, leads and appointments. */
function computeStats(
  projectId: string,
  units: InventoryUnit[],
  leads: Lead[],
  appointments: Appointment[]
): ProjectStats {
  const projectUnits = units.filter((unit) => unit.project_id === projectId)
  const unitsCount = projectUnits.length
  // Progress is the share of inventory that is sold.
  const soldCount = projectUnits.filter((unit) => unit.status === "sold").length
  const soldPct =
    unitsCount > 0 ? Math.round((soldCount / unitsCount) * 100) : 0
  // Price range only considers residential units (houses & apartments).
  const prices = projectUnits
    .filter(
      (unit) => unit.unit_type === "house" || unit.unit_type === "apartment"
    )
    .map((unit) => (unit.price == null ? null : Number(unit.price)))
    .filter((price): price is number => price != null)
  return {
    priceMin: prices.length ? Math.min(...prices) : null,
    priceMax: prices.length ? Math.max(...prices) : null,
    unitsCount,
    soldPct,
    leadsCount: leads.filter((lead) => lead.project_id === projectId).length,
    appointmentsCount: appointments.filter(
      (appointment) => appointment.project_id === projectId
    ).length,
  }
}

function RouteComponent() {
  const [projects, setProjects] = useState<Project[]>([])
  const [units, setUnits] = useState<InventoryUnit[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const isAdmin = useAuthStore((state) => state.profile?.role === "admin")

  useEffect(() => {
    let active = true
    Promise.all([
      projectsService.list(),
      inventoryService.list(),
      leadsService.list(),
      appointmentsService.list(),
    ])
      .then(([loadedProjects, loadedUnits, loadedLeads, loadedAppointments]) => {
        if (!active) return
        setProjects(loadedProjects)
        setUnits(loadedUnits)
        setLeads(loadedLeads)
        setAppointments(loadedAppointments)
      })
      .catch((error) => {
        toast.error(
          error instanceof Error ? error.message : "Failed to load projects"
        )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const statsByProject = useMemo(() => {
    const map = new Map<string, ProjectStats>()
    for (const project of projects) {
      map.set(project.id, computeStats(project.id, units, leads, appointments))
    }
    return map
  }, [projects, units, leads, appointments])

  return (
    <div className="p-4">
      {isAdmin && (
        <HeaderSlot>
          <ProjectSheet
            onSaved={(project) => setProjects((prev) => [project, ...prev])}
            trigger={
              <Button size="sm">
                <PlusIcon />
                New project
              </Button>
            }
          />
        </HeaderSlot>
      )}

      {loading ? (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <p className="text-center text-muted-foreground">No projects yet.</p>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              stats={
                statsByProject.get(project.id) ?? {
                  priceMin: null,
                  priceMax: null,
                  unitsCount: 0,
                  soldPct: 0,
                  leadsCount: 0,
                  appointmentsCount: 0,
                }
              }
              isAdmin={isAdmin}
              onSaved={(updated) =>
                setProjects((prev) =>
                  prev.map((project) =>
                    project.id === updated.id ? updated : project
                  )
                )
              }
              onDeleted={(id) =>
                setProjects((prev) =>
                  prev.filter((project) => project.id !== id)
                )
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
