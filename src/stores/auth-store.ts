import { create } from "zustand"
import { authService, type Profile } from "@/services"

type AuthStore = {
  /** The signed-in user's profile, or null when unknown / signed out. */
  profile: Profile | null
  /** True while loadProfile() is in flight. */
  isLoading: boolean
  setProfile: (profile: Profile | null) => void
  /** Fetch the current user's profile from the server and store it. */
  loadProfile: () => Promise<void>
  /** Reset to signed-out state (call on sign-out). */
  clear: () => void
}

// Deliberately NOT persisted: the profile/role is security-adjacent and the
// session is owned by Supabase Auth. It is re-derived from the server on login
// and on app boot. Actual access enforcement lives in RLS — this store only
// drives UI (conditional rendering, showing the user's name, etc.).
export const useAuthStore = create<AuthStore>((set) => ({
  profile: null,
  isLoading: false,
  setProfile: (profile) => set({ profile }),
  loadProfile: async () => {
    set({ isLoading: true })
    const profile = await authService.getCurrentProfile()
    set({ profile, isLoading: false })
  },
  clear: () => set({ profile: null, isLoading: false }),
}))
