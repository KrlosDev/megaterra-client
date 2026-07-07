import supabase from "./supabase"

/** Lead context embedded with each quote. */
export type QuoteLead = { lead_name: string; lead_phone: string | null }

/** Project context embedded with each quote. */
export type QuoteProject = { project_name: string }

/** Inventory unit context embedded with each quote. */
export type QuoteUnit = { unit: string }

/** Advisor (profile) context embedded with each quote. */
export type QuoteAdvisor = { display_name: string | null; email: string }

/** A row from public.quotes, with lead + project + unit + advisor embedded.
 * The financial fields are a snapshot taken when the quote was generated. */
export type Quote = {
  id: string
  lead_id: string | null
  project_id: string | null
  unit_id: string | null
  client_name: string | null
  currency: string | null
  price: number | null
  down_pct: number | null
  down_amount: number | null
  financed: number | null
  term_years: number | null
  term_months: number | null
  interest_rate: number | null
  monthly_payment: number | null
  total: number | null
  sent: boolean
  sent_at: string | null
  advisor_id: string | null
  created_at: string
  updated_at: string
  lead: QuoteLead | null
  project: QuoteProject | null
  unit: QuoteUnit | null
  advisor: QuoteAdvisor | null
}

/** Fields accepted when creating a quote (server fills id/timestamps and
 * defaults sent to false). Persisted automatically when a PDF is downloaded. */
export type NewQuote = {
  lead_id: string | null
  project_id: string | null
  unit_id: string | null
  client_name: string | null
  currency: string | null
  price: number | null
  down_pct: number | null
  down_amount: number | null
  financed: number | null
  term_years: number | null
  term_months: number | null
  interest_rate: number | null
  monthly_payment: number | null
  total: number | null
  advisor_id: string | null
}

const QUOTE_COLUMNS =
  "id, lead_id, project_id, unit_id, client_name, currency, price, down_pct, down_amount, financed, term_years, term_months, interest_rate, monthly_payment, total, sent, sent_at, advisor_id, created_at, updated_at, lead:leads(lead_name, lead_phone), project:projects(project_name), unit:inventory(unit), advisor:profiles(display_name, email)"

export const quotesService = {
  // List all quotes, newest first. Readable by every authenticated user.
  list: async (): Promise<Quote[]> => {
    const { data, error } = await supabase
      .from("quotes")
      .select(QUOTE_COLUMNS)
      .order("created_at", { ascending: false })
    if (error) throw error
    return (data ?? []) as unknown as Quote[]
  },

  // Quotes made for a single lead, newest first (for the lead-detail view).
  listByLead: async (leadId: string): Promise<Quote[]> => {
    const { data, error } = await supabase
      .from("quotes")
      .select(QUOTE_COLUMNS)
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
    if (error) throw error
    return (data ?? []) as unknown as Quote[]
  },

  // Record a quote. Insert is allowed for any authenticated user by RLS.
  create: async (input: NewQuote): Promise<Quote> => {
    const { data, error } = await supabase
      .from("quotes")
      .insert(input)
      .select(QUOTE_COLUMNS)
      .single()
    if (error) throw error
    return data as unknown as Quote
  },

  // Toggle the sent flag; stamps sent_at when marking sent, clears it otherwise.
  // Used by the manual toggle and by WhatsApp sending once that is wired up.
  setSent: async (id: string, sent: boolean): Promise<Quote> => {
    const { data, error } = await supabase
      .from("quotes")
      .update({ sent, sent_at: sent ? new Date().toISOString() : null })
      .eq("id", id)
      .select(QUOTE_COLUMNS)
      .single()
    if (error) throw error
    return data as unknown as Quote
  },
}

export default quotesService
