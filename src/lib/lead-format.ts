import type { LeadStage, LeadTemperature } from "@/services"
import { activeLocale } from "./locale"

/** Human-readable labels for the lead_stage enum values. */
export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  broker_not_qualified: "Broker – Not Qualified",
  not_qualified: "Not Qualified",
  potential_client: "Potential Client",
  no_answer: "No Answer",
  new_lead: "New Lead",
  future_contact: "Future Contact",
  follow_up: "Follow Up",
  visit_scheduled: "Visit Scheduled",
  visit_completed: "Visit Completed",
  visit_canceled: "Visit Canceled",
  under_contract_negotiation: "Under Contract / Negotiation",
}

/** Pipeline groupings for the leads summary cards. Every stage belongs to
 * exactly one group; the cards show a count per group while the filter pills
 * stay per-stage. */
export const LEAD_STAGE_GROUPS = {
  new: ["new_lead", "no_answer"],
  in_progress: [
    "follow_up",
    "future_contact",
    "potential_client",
    "visit_scheduled",
    "visit_completed",
    "visit_canceled",
  ],
  negotiation: ["under_contract_negotiation"],
  lost: ["not_qualified", "broker_not_qualified"],
} satisfies Record<string, LeadStage[]>

export type LeadStageGroup = keyof typeof LEAD_STAGE_GROUPS

/** Labels for the summary-card groups, in display order. */
export const LEAD_STAGE_GROUP_LABELS: Record<LeadStageGroup, string> = {
  new: "New",
  in_progress: "In Progress",
  negotiation: "Negotiation",
  lost: "Lost",
}

/** Ordered list of stages for the filter pills (pipeline order). */
export const LEAD_STAGE_ORDER: LeadStage[] = [
  ...LEAD_STAGE_GROUPS.new,
  ...LEAD_STAGE_GROUPS.in_progress,
  ...LEAD_STAGE_GROUPS.negotiation,
  ...LEAD_STAGE_GROUPS.lost,
]

/** Human-readable labels for the temperature enum values. */
export const LEAD_TEMPERATURE_LABELS: Record<LeadTemperature, string> = {
  hot: "Hot",
  warm: "Warm",
  cold: "Cold",
}

/** Badge variant per temperature, for visual differentiation. */
export const LEAD_TEMPERATURE_VARIANTS: Record<
  LeadTemperature,
  "default" | "secondary" | "destructive"
> = {
  hot: "destructive",
  warm: "default",
  cold: "secondary",
}

/** Format a budget range in the project's currency (falls back to USD/plain). */
export function formatBudget(
  min: number | null,
  max: number | null,
  currency: string | null
): string {
  if (min == null && max == null) return "—"
  const locale = activeLocale()
  const fmt = (amount: number) => {
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currency || "USD",
        maximumFractionDigits: 0,
      }).format(amount)
    } catch {
      return `${amount.toLocaleString(locale)}${currency ? ` ${currency}` : ""}`
    }
  }
  if (min != null && max != null) return `${fmt(Number(min))} – ${fmt(Number(max))}`
  if (min != null) return `${fmt(Number(min))}+`
  return fmt(Number(max))
}

/** Compact budget range for tight spaces (e.g. `$80K–$120K`). Falls back to
 * plain compact numbers if the currency code is unsupported. */
export function formatBudgetCompact(
  min: number | null,
  max: number | null,
  currency: string | null
): string {
  if (min == null && max == null) return "—"
  const locale = activeLocale()
  const fmt = (amount: number) => {
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currency || "USD",
        notation: "compact",
        maximumFractionDigits: 0,
      }).format(amount)
    } catch {
      return `${new Intl.NumberFormat(locale, {
        notation: "compact",
        maximumFractionDigits: 0,
      }).format(amount)}${currency ? ` ${currency}` : ""}`
    }
  }
  if (min != null && max != null) return `${fmt(Number(min))}–${fmt(Number(max))}`
  if (min != null) return `${fmt(Number(min))}+`
  return fmt(Number(max))
}
