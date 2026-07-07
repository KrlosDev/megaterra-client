import supabase from "./supabase"

export type LeadTemperature = "hot" | "warm" | "cold"
export type LeadStage =
  | "broker_not_qualified"
  | "not_qualified"
  | "potential_client"
  | "no_answer"
  | "new_lead"
  | "future_contact"
  | "follow_up"
  | "visit_scheduled"
  | "visit_completed"
  | "visit_canceled"
  | "under_contract_negotiation"

/** Project context embedded with each lead (name + currency for the budget). */
export type LeadProject = { project_name: string; currency: string | null }

/** Advisor (profile) context embedded with each lead. */
export type LeadAdvisor = { display_name: string | null; email: string }

/** A row from public.leads, with project + advisor embedded. */
export type Lead = {
  id: string
  lead_name: string
  lead_email: string | null
  lead_phone: string | null
  lead_source: string | null
  ad_name: string | null
  form_name: string | null
  created_date: string
  target_interest: string | null
  budget_min: number | null
  budget_max: number | null
  temperature: LeadTemperature | null
  last_contacted: string | null
  lead_stage: LeadStage
  advisor_id: string | null
  project_id: string | null
  created_at: string
  updated_at: string
  project: LeadProject | null
  advisor: LeadAdvisor | null
}

/** Fields accepted when creating a lead (server fills id/timestamps). The
 * caller sets `created_date` to the creation time and `lead_stage` (defaults to
 * "new_lead" in the UI). */
export type NewLead = {
  lead_name: string
  lead_email: string | null
  lead_phone: string | null
  lead_source: string | null
  target_interest: string | null
  budget_min: number | null
  budget_max: number | null
  temperature: LeadTemperature | null
  lead_stage: LeadStage
  advisor_id: string | null
  project_id: string | null
  created_date: string
}

const LEAD_COLUMNS =
  "id, lead_name, lead_email, lead_phone, lead_source, ad_name, form_name, created_date, target_interest, budget_min, budget_max, temperature, last_contacted, lead_stage, advisor_id, project_id, created_at, updated_at, project:projects(project_name, currency), advisor:profiles(display_name, email)"

export const leadsService = {
  // List all leads, newest first. Readable by every authenticated user.
  list: async (): Promise<Lead[]> => {
    const { data, error } = await supabase
      .from("leads")
      .select(LEAD_COLUMNS)
      .order("created_date", { ascending: false })
    if (error) throw error
    return (data ?? []) as unknown as Lead[]
  },

  // Fetch a single lead by id, with project + advisor embedded. Null if missing.
  get: async (id: string): Promise<Lead | null> => {
    const { data, error } = await supabase
      .from("leads")
      .select(LEAD_COLUMNS)
      .eq("id", id)
      .maybeSingle()
    if (error) throw error
    return (data ?? null) as unknown as Lead | null
  },

  // Create a single lead. Insert is allowed for any authenticated user by RLS.
  create: async (input: NewLead): Promise<Lead> => {
    const { data, error } = await supabase
      .from("leads")
      .insert(input)
      .select(LEAD_COLUMNS)
      .single()
    if (error) throw error
    return data as unknown as Lead
  },

  // Update any subset of a lead's fields (used by the edit sheet). Returns the
  // refreshed row so project/advisor stay populated.
  update: async (id: string, patch: Partial<NewLead>): Promise<Lead> => {
    const { data, error } = await supabase
      .from("leads")
      .update(patch)
      .eq("id", id)
      .select(LEAD_COLUMNS)
      .single()
    if (error) throw error
    return data as unknown as Lead
  },

  // Move a lead to a different pipeline stage (used by the Pipeline board's
  // drag-and-drop). Returns the refreshed row so project/advisor stay populated.
  updateStage: async (id: string, lead_stage: LeadStage): Promise<Lead> => {
    const { data, error } = await supabase
      .from("leads")
      .update({ lead_stage })
      .eq("id", id)
      .select(LEAD_COLUMNS)
      .single()
    if (error) throw error
    return data as unknown as Lead
  },
}

export default leadsService
