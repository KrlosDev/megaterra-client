import { useState } from "react"
import { Link } from "@tanstack/react-router"
import {
  ArrowRightIcon,
  DollarSignIcon,
  HomeIcon,
  LayoutGridIcon,
  MapPinIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"
import { projectsService, type Project } from "@/services"
import { HEADER_GRADIENTS, PROJECT_STATUS_LABELS } from "@/lib/project-format"
import { formatPrice } from "@/lib/inventory-format"
import { cn } from "@/lib/utils"
import { ProjectSheet } from "@/components/projects/project-sheet"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

/** Aggregated, derived figures shown on a project card. */
export type ProjectStats = {
  /** Lowest/highest price among house & apartment units (null if none). */
  priceMin: number | null
  priceMax: number | null
  /** Total number of inventory units in the project. */
  unitsCount: number
  /** Percentage of inventory that is sold. */
  soldPct: number
  leadsCount: number
  appointmentsCount: number
}

export function ProjectCard({
  project,
  stats,
  isAdmin,
  onSaved,
  onDeleted,
}: {
  project: Project
  stats: ProjectStats
  isAdmin: boolean
  onSaved: (project: Project) => void
  onDeleted: (id: string) => void
}) {
  const [deleting, setDeleting] = useState(false)

  const location = project.address || project.country || null
  const priceRange =
    stats.priceMin != null && stats.priceMax != null
      ? `${formatPrice(stats.priceMin, project.currency)} – ${formatPrice(stats.priceMax, project.currency)}`
      : null

  async function handleDelete() {
    setDeleting(true)
    try {
      await projectsService.remove(project.id)
      toast.success("Project deleted")
      onDeleted(project.id)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete project"
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
      {/* Gradient header */}
      <div
        className={cn(
          "relative h-20 bg-linear-to-br",
          HEADER_GRADIENTS[project.project_status]
        )}
      >
        <span className="absolute top-2 left-2 rounded-full bg-background px-2 py-0.5 text-xs font-medium text-foreground shadow-sm">
          {PROJECT_STATUS_LABELS[project.project_status]}
        </span>
        {isAdmin && (
          <div className="absolute top-2 right-2 flex items-center gap-1">
            <ProjectSheet
              project={project}
              onSaved={onSaved}
              trigger={
                <Button
                  size="icon-sm"
                  variant="secondary"
                  className="rounded-full bg-background hover:bg-background/80"
                  aria-label="Edit project"
                >
                  <PencilIcon />
                </Button>
              }
            />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="icon-sm"
                  variant="secondary"
                  className="rounded-full bg-background text-destructive hover:bg-background/80"
                  aria-label="Delete project"
                >
                  <Trash2Icon />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Delete {project.project_name}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    The project will be removed from the list. Its leads,
                    inventory and appointments are kept and can be restored by
                    an admin.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleting}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={deleting}
                    className="bg-destructive text-white hover:bg-destructive/90"
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-1.5">
          <h3 className="truncate text-sm font-semibold">
            {project.project_name}
          </h3>
        </div>

        {project.project_description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {project.project_description}
          </p>
        )}

        <dl className="flex flex-col gap-1 text-xs">
          <InfoRow icon={<MapPinIcon className="size-3.5" />} value={location} />
          <InfoRow
            icon={<HomeIcon className="size-3.5" />}
            value={project.inventory_description}
          />
          <InfoRow
            icon={<DollarSignIcon className="size-3.5" />}
            value={priceRange}
          />
          <InfoRow
            icon={<LayoutGridIcon className="size-3.5" />}
            value={`${stats.unitsCount} ${stats.unitsCount === 1 ? "unit" : "units"}`}
          />
        </dl>

        <div className="mt-auto flex flex-col gap-1 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{stats.soldPct}%</span>
          </div>
          <Progress value={stats.soldPct} />
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 border-t pt-2.5 text-xs font-semibold text-primary">
          <span>{stats.leadsCount} leads</span>
          <span>
            {stats.appointmentsCount}{" "}
            {stats.appointmentsCount === 1 ? "appt" : "appts"}
          </span>
          <Link
            to="/projects/$projectId"
            params={{ projectId: project.id }}
            className="ml-auto inline-flex items-center gap-0.5 hover:underline"
          >
            View
            <ArrowRightIcon className="size-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}

function InfoRow({
  icon,
  value,
}: {
  icon: React.ReactNode
  value: string | null
}) {
  return (
    <div className="flex items-center gap-1.5 text-muted-foreground">
      <span className="shrink-0 text-muted-foreground/80">{icon}</span>
      <span className="truncate text-foreground">{value ?? "—"}</span>
    </div>
  )
}
