import supabase from "./supabase"

/** A free-text note attached to a lead (public.lead_notes). */
export type LeadNote = {
  id: string
  lead_id: string
  note: string
  created_at: string
}

/** Fields accepted when creating a note (server fills id/created_at). */
export type NewLeadNote = {
  lead_id: string
  note: string
}

const NOTE_COLUMNS = "id, lead_id, note, created_at"

export const notesService = {
  // Notes for a single lead, newest first. Readable by every authenticated user.
  listByLead: async (leadId: string): Promise<LeadNote[]> => {
    const { data, error } = await supabase
      .from("lead_notes")
      .select(NOTE_COLUMNS)
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
    if (error) throw error
    return (data ?? []) as LeadNote[]
  },

  // Add a note. Insert is allowed for any authenticated user by RLS.
  create: async (input: NewLeadNote): Promise<LeadNote> => {
    const { data, error } = await supabase
      .from("lead_notes")
      .insert(input)
      .select(NOTE_COLUMNS)
      .single<LeadNote>()
    if (error) throw error
    return data
  },
}

export default notesService
