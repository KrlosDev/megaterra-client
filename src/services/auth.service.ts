import supabase from "./supabase"

export type AppRole = "admin" | "executive"
export type IdType = "national_id" | "passport"
export type AppLanguage = "en" | "es"

/** A row from public.profiles, with the role name resolved from roles. */
export type Profile = {
  id: string
  auth_id: string
  email: string
  display_name: string | null
  phone_number: string | null
  id_number: string | null
  id_type: IdType | null
  role_id: string | null
  preferred_language: AppLanguage | null
  role: AppRole | null
}

// Raw shape returned by the profiles select below (roles is a to-one embed).
type ProfileRow = Omit<Profile, "role"> & {
  roles: { name: string } | null
}

const PROFILE_COLUMNS =
  "id, auth_id, email, display_name, phone_number, id_number, id_type, role_id, preferred_language, roles(name)"

export const authService = {
  // Sign a user in with email + password; returns the session/user data.
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  },

  // Sign the current user out.
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Persist the current user's UI language. Goes through a SECURITY DEFINER RPC
  // so non-admins can update this one column despite the admin-only write policy.
  setPreferredLanguage: async (lang: AppLanguage): Promise<void> => {
    const { error } = await supabase.rpc("set_my_preferred_language", { lang })
    if (error) throw error
  },

  // Return the current session (or null if not authenticated).
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session
  },

  // List every profile (advisors), alphabetically by display name. Profiles are
  // readable by all authenticated users; used e.g. for the admin advisor picker.
  listProfiles: async (): Promise<Profile[]> => {
    const { data, error } = await supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .order("display_name", { ascending: true })
    if (error) throw error
    // Supabase types the to-one `roles(name)` embed as an array; it's an object
    // at runtime, so cast through unknown (as getCurrentProfile does via single).
    return ((data as unknown as ProfileRow[] | null) ?? []).map((row) => {
      const roleName = row.roles?.name
      const { roles, ...rest } = row
      return {
        ...rest,
        role: roleName === "admin" || roleName === "executive" ? roleName : null,
      }
    })
  },

  // Return the signed-in user's full profile (incl. role name), or null.
  // Profiles are readable by everyone, so we scope to the current user's auth_id.
  getCurrentProfile: async (): Promise<Profile | null> => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null
    const { data, error } = await supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("auth_id", user.id)
      .single<ProfileRow>()
    if (error || !data) return null
    const roleName = data.roles?.name
    const { roles, ...rest } = data
    // Narrow the DB's free-form role string to our known union (or null).
    return {
      ...rest,
      role: roleName === "admin" || roleName === "executive" ? roleName : null,
    }
  },
}

export default authService
