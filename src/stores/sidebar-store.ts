import { create } from "zustand"
import { persist } from "zustand/middleware"

type SidebarStore = {
  /** Whether the sidebar is expanded (true) or collapsed to icons (false). */
  open: boolean
  /** Open/closed state of each NavMain item, keyed by its title. */
  openItems: Record<string, boolean>
  setOpen: (open: boolean) => void
  toggleSidebar: () => void
  setItemOpen: (title: string, open: boolean) => void
  toggleItem: (title: string) => void
}

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set) => ({
      open: true,
      openItems: {},
      setOpen: (open) => set({ open }),
      toggleSidebar: () => set((state) => ({ open: !state.open })),
      setItemOpen: (title, open) =>
        set((state) => ({
          openItems: { ...state.openItems, [title]: open },
        })),
      toggleItem: (title) =>
        set((state) => ({
          openItems: { ...state.openItems, [title]: !state.openItems[title] },
        })),
    }),
    { name: "sidebar" }
  )
)
