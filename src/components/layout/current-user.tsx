/* eslint-disable react-refresh/only-export-components */
import * as React from "react"
import { useAuthStore } from "@/stores/auth-store"

/** View-model shared with every screen under the main layout. */
export type CurrentUser = {
  /** Display name, falling back to the email when none is set. */
  name: string
  email: string
  /** Up-to-two-character initials, for the avatar fallback. */
  initials: string
}

const CurrentUserContext = React.createContext<CurrentUser | undefined>(
  undefined
)

/** Build up-to-two-character initials from a name, falling back to the email. */
function getInitials(name: string, email: string): string {
  const source = name.trim() || email
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * Reads the signed-in profile from the auth store once and exposes a derived
 * user view-model to all descendants, so individual screens don't each have to
 * consult the store.
 */
export function CurrentUserProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = useAuthStore((state) => state.profile)

  const user = React.useMemo<CurrentUser>(() => {
    const name = profile?.display_name?.trim() || profile?.email || ""
    const email = profile?.email ?? ""
    return { name, email, initials: getInitials(name, email) }
  }, [profile])

  return (
    <CurrentUserContext.Provider value={user}>
      {children}
    </CurrentUserContext.Provider>
  )
}

export function useCurrentUser(): CurrentUser {
  const context = React.useContext(CurrentUserContext)
  if (context === undefined) {
    throw new Error("useCurrentUser must be used within a CurrentUserProvider")
  }
  return context
}
