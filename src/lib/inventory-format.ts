import type { InventoryStatus, SizeType, UnitType } from "@/services"
import { SIZE_TYPE_LABELS } from "./project-format"
import { activeLocale } from "./locale"

/** Human-readable labels for the inventory status enum values. */
export const INVENTORY_STATUS_LABELS: Record<InventoryStatus, string> = {
  available: "Available",
  under_contract: "Under Contract",
  sold: "Sold",
}

/** Human-readable labels for the unit_type enum values. */
export const UNIT_TYPE_LABELS: Record<UnitType, string> = {
  apartment: "Apartment",
  house: "House",
  deposit: "Deposit",
  parking: "Parking",
}

/** Badge variant to use per status, for visual differentiation. */
export const INVENTORY_STATUS_VARIANTS: Record<
  InventoryStatus,
  "default" | "secondary" | "outline"
> = {
  available: "default",
  under_contract: "outline",
  sold: "secondary",
}

/** Format a price in the project's currency (falls back to a plain number). */
export function formatPrice(
  price: number | null,
  currency: string | null
): string {
  if (price == null) return "—"
  const amount = Number(price)
  const locale = activeLocale()
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    // Unknown/invalid currency code — show the number with the raw code.
    return `${amount.toLocaleString(locale)}${currency ? ` ${currency}` : ""}`
  }
}

/** Format a unit size with the project's area unit (sq ft / sq m). */
export function formatSize(
  size: number | null,
  sizeType: SizeType | null
): string {
  if (size == null) return "—"
  const value = Number(size).toLocaleString(activeLocale())
  return sizeType ? `${value} ${SIZE_TYPE_LABELS[sizeType]}` : value
}
