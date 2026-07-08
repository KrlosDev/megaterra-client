import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import type { Lead } from "@/services"
import { cn } from "@/lib/utils"

/** Which lead field the attribution bars break down by. */
type Dimension = "source" | "ad" | "form"

const DIMENSION_ACCESSOR: Record<Dimension, (lead: Lead) => string | null> = {
  source: (lead) => lead.lead_source,
  ad: (lead) => lead.ad_name,
  form: (lead) => lead.form_name,
}

/** Bars beyond this rank fold into a single "Other" bucket (never cycle hues /
 * overflow the card — see the dataviz "9th series" rule). */
const MAX_BARS = 8

type Bucket = { label: string; count: number; isOther: boolean }

/**
 * Horizontal bar chart of lead counts grouped by acquisition channel
 * (source / ad name / form name). A single-series magnitude chart, so it uses
 * one hue (the primary token) with direct value labels and no legend.
 */
export function LeadsAttributionChart({ leads }: { leads: Lead[] }) {
  const { t } = useTranslation()
  const [dimension, setDimension] = useState<Dimension>("source")

  const buckets = useMemo<Bucket[]>(() => {
    const unknownLabel = t("dashboard.unknown")
    const accessor = DIMENSION_ACCESSOR[dimension]
    const tally = new Map<string, number>()
    for (const lead of leads) {
      const raw = accessor(lead)?.trim()
      const label = raw ? raw : unknownLabel
      tally.set(label, (tally.get(label) ?? 0) + 1)
    }
    const sorted = [...tally.entries()]
      .map(([label, count]) => ({ label, count, isOther: false }))
      .sort((first, second) => second.count - first.count)
    if (sorted.length <= MAX_BARS) return sorted
    const top = sorted.slice(0, MAX_BARS)
    const otherCount = sorted
      .slice(MAX_BARS)
      .reduce((sum, bucket) => sum + bucket.count, 0)
    return [
      ...top,
      { label: t("dashboard.otherBucket"), count: otherCount, isOther: true },
    ]
  }, [leads, dimension, t])

  const max = buckets.reduce((largest, bucket) => Math.max(largest, bucket.count), 0)

  const tabs: { value: Dimension; label: string }[] = [
    { value: "source", label: t("dashboard.bySource") },
    { value: "ad", label: t("dashboard.byAdName") },
    { value: "form", label: t("dashboard.byFormName") },
  ]

  return (
    <div className="flex h-full flex-col rounded-xl border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{t("dashboard.attributionTitle")}</h2>
        <div className="flex rounded-lg bg-muted p-0.5">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setDimension(tab.value)}
              aria-pressed={dimension === tab.value}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                dimension === tab.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {buckets.length === 0 ? (
        <p className="flex flex-1 items-center justify-center py-10 text-sm text-muted-foreground">
          {t("dashboard.attributionEmpty")}
        </p>
      ) : (
        <ul className="mt-5 flex flex-col gap-2.5">
          {buckets.map((bucket) => (
            <li
              key={bucket.label}
              className="group flex items-center gap-3"
              title={`${bucket.label}: ${bucket.count}`}
            >
              <span className="w-28 shrink-0 truncate text-sm text-muted-foreground">
                {bucket.label}
              </span>
              <div className="flex flex-1 items-center">
                <div
                  className={cn(
                    "h-5 rounded-r-sm transition-[width,background-color]",
                    bucket.isOther
                      ? "bg-muted-foreground/40 group-hover:bg-muted-foreground/55"
                      : "bg-primary group-hover:bg-primary/85"
                  )}
                  style={{
                    width: max > 0 ? `${(bucket.count / max) * 100}%` : "0%",
                    minWidth: bucket.count > 0 ? "0.375rem" : 0,
                  }}
                />
                <span className="ml-2 text-xs font-medium tabular-nums text-muted-foreground">
                  {bucket.count}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
