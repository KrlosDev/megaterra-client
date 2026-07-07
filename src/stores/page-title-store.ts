import { create } from "zustand"

// Lets a page override the header title (derived from the URL by default),
// e.g. a detail page showing an entity name instead of its id.
type PageTitleStore = {
  override: string | null
  setOverride: (title: string | null) => void
}

export const usePageTitleStore = create<PageTitleStore>((set) => ({
  override: null,
  setOverride: (override) => set({ override }),
}))
