import supabase from "./supabase"

export type ProjectStatus = "pre_sale" | "in_construction" | "move_in_ready"
export type SizeType = "sqft" | "sqm"
/** Lifecycle of the record itself (independent of the sales project_status). */
export type ProjectRecordStatus = "active" | "archived" | "deleted"

/** A row from public.projects. */
export type Project = {
  id: string
  project_name: string
  project_description: string | null
  project_status: ProjectStatus
  address: string | null
  inventory_description: string | null
  country: string | null
  currency: string | null
  size_type: SizeType | null
  record_status: ProjectRecordStatus
  created_at: string
  updated_at: string
}

/** Fields accepted when creating a project (server fills id/timestamps). */
export type NewProject = {
  project_name: string
  project_description: string | null
  project_status: ProjectStatus
  address: string | null
  inventory_description: string | null
  country: string | null
  currency: string | null
  size_type: SizeType | null
}

const PROJECT_COLUMNS =
  "id, project_name, project_description, project_status, address, inventory_description, country, currency, size_type, record_status, created_at, updated_at"

export const projectsService = {
  // List active projects, newest first. Soft-deleted/archived rows are hidden.
  // Readable by every authenticated user.
  list: async (): Promise<Project[]> => {
    const { data, error } = await supabase
      .from("projects")
      .select(PROJECT_COLUMNS)
      .eq("record_status", "active")
      .order("created_at", { ascending: false })
    if (error) throw error
    return (data ?? []) as Project[]
  },

  // Fetch a single project by id (any record_status). Returns null if missing.
  get: async (id: string): Promise<Project | null> => {
    const { data, error } = await supabase
      .from("projects")
      .select(PROJECT_COLUMNS)
      .eq("id", id)
      .maybeSingle<Project>()
    if (error) throw error
    return data
  },

  // Create a project. Restricted to admins by RLS (projects_write_admin).
  create: async (input: NewProject): Promise<Project> => {
    const { data, error } = await supabase
      .from("projects")
      .insert(input)
      .select(PROJECT_COLUMNS)
      .single<Project>()
    if (error) throw error
    return data
  },

  // Update a project. Restricted to admins by RLS (projects_write_admin).
  update: async (id: string, input: Partial<NewProject>): Promise<Project> => {
    const { data, error } = await supabase
      .from("projects")
      .update(input)
      .eq("id", id)
      .select(PROJECT_COLUMNS)
      .single<Project>()
    if (error) throw error
    return data
  },

  // Soft-delete a project (marks record_status='deleted' so linked leads,
  // inventory and appointments are preserved). Admin-only by RLS.
  remove: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from("projects")
      .update({ record_status: "deleted" })
      .eq("id", id)
    if (error) throw error
  },
}

export default projectsService
