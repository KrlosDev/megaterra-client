import { useRouterState } from "@tanstack/react-router"
import { usePageTitleStore } from "@/stores/page-title-store"

export function usePageTitle() {
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
    return "Home"
  }

  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
