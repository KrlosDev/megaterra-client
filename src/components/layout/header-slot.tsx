import * as React from "react"
import { createPortal } from "react-dom"

/**
 * A slot in the app header that pages can fill with their own actions
 * (tabs, buttons, filters…). MainLayout renders the target once; any page
 * under the layout renders <HeaderSlot>…</HeaderSlot> to portal content into
 * it. Because it's a React portal, context/state (e.g. Tabs) still works even
 * though the markup renders up in the header.
 */
const HeaderSlotContext = React.createContext<HTMLElement | null>(null)
const HeaderSlotSetContext = React.createContext<
  (el: HTMLElement | null) => void
>(() => {})

export function HeaderSlotProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [container, setContainer] = React.useState<HTMLElement | null>(null)
  return (
    <HeaderSlotSetContext.Provider value={setContainer}>
      <HeaderSlotContext.Provider value={container}>
        {children}
      </HeaderSlotContext.Provider>
    </HeaderSlotSetContext.Provider>
  )
}

/** Rendered by MainLayout in the header — the destination for HeaderSlot. */
export function HeaderSlotTarget({ className }: { className?: string }) {
  const setContainer = React.useContext(HeaderSlotSetContext)
  return <div ref={setContainer} className={className} />
}

/** Rendered by a page to inject content into the header. */
export function HeaderSlot({ children }: { children: React.ReactNode }) {
  const container = React.useContext(HeaderSlotContext)
  if (!container) return null
  return createPortal(children, container)
}
