import type { ProjectStatus, SizeType } from "@/services/projects.service"

/** Human-readable labels for the project_status enum values. */
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  pre_sale: "Pre-sale",
  in_construction: "In construction",
  move_in_ready: "Move In Ready",
}

/** Human-readable labels for the size_type enum values. */
export const SIZE_TYPE_LABELS: Record<SizeType, string> = {
  sqft: "ft²",
  sqm: "m²",
}

/** Badge variant to use per status, for visual differentiation. */
export const PROJECT_STATUS_VARIANTS: Record<
  ProjectStatus,
  "default" | "secondary" | "outline"
> = {
  pre_sale: "secondary",
  in_construction: "outline",
  move_in_ready: "default",
}

/** Soft pastel green→teal header gradient, varied a little by sales status. */
export const HEADER_GRADIENTS: Record<ProjectStatus, string> = {
  pre_sale: "from-emerald-100 to-green-200",
  in_construction: "from-emerald-200 to-teal-200",
  move_in_ready: "from-teal-100 to-emerald-200",
}
