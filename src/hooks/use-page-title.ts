import { useRouterState } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { usePageTitleStore } from "@/stores/page-title-store"

export function usePageTitle() {
  const { t } = useTranslation()
  const override = usePageTitleStore((state) => state.override)
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  // A page (e.g. a detail view) can set a friendlier title than the URL slug.
  if (override) {
    return override
  }

  const segments = pathname.split("/").filter(Boolean)
  let segment = segments.pop()

  // Detail routes end in a record id (uuid). Until the page sets a friendlier
  // override (the entity name), fall back to the parent section name rather
  // than flashing the raw id in the header.
  if (segment && UUID_RE.test(segment)) {
    segment = segments.pop()
  }

  if (!segment) {
    return t("nav.home")
  }

  // Prefer the translated nav label for this route segment; fall back to the
  // title-cased slug for any route without a nav entry.
  const titleCased = segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
  return t(`nav.${segment}`, { defaultValue: titleCased })
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
