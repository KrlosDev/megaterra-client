import supabase from "./supabase"

export type AppointmentType = "in_person" | "call" | "zoom"
export type AppointmentStatus =
  | "pending_confirmation"
  | "confirmed"
  | "cancelled"
  | "showed_up"
  | "no_show"
  | "rescheduled"

/** Project context embedded with each appointment. */
export type AppointmentProject = { project_name: string }

/** Lead context embedded with each appointment. */
export type AppointmentLead = { lead_name: string; lead_phone: string | null }

/** Advisor (profile) context embedded with each appointment. */
export type AppointmentAdvisor = { display_name: string | null; email: string }

/** A row from public.appointments, with project + lead + advisor embedded. */
export type Appointment = {
  id: string
  project_id: string
  lead_id: string
  advisor_id: string | null
  status: AppointmentStatus
  appointment_type: AppointmentType
  scheduled_at: string
  original_scheduled_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
  project: AppointmentProject | null
  lead: AppointmentLead | null
  advisor: AppointmentAdvisor | null
}

/** Fields accepted when creating an appointment (server fills id/timestamps and
 * defaults status to 'pending_confirmation' when omitted). */
export type NewAppointment = {
  project_id: string
  lead_id: string
  advisor_id: string | null
  appointment_type: AppointmentType
  scheduled_at: string
  notes: string | null
  status?: AppointmentStatus
}

/** Mutable fields (status change / reschedule / notes). */
export type AppointmentUpdate = Partial<{
  status: AppointmentStatus
  appointment_type: AppointmentType
  scheduled_at: string
  original_scheduled_at: string | null
  notes: string | null
}>

const APPOINTMENT_COLUMNS =
  "id, project_id, lead_id, advisor_id, status, appointment_type, scheduled_at, original_scheduled_at, notes, created_at, updated_at, project:projects(project_name), lead:leads(lead_name, lead_phone), advisor:profiles(display_name, email)"

export const appointmentsService = {
  // List all appointments, soonest first. Readable by every authenticated user.
  list: async (): Promise<Appointment[]> => {
    const { data, error } = await supabase
      .from("appointments")
      .select(APPOINTMENT_COLUMNS)
      .order("scheduled_at", { ascending: true })
    if (error) throw error
    return (data ?? []) as unknown as Appointment[]
  },

  // Create an appointment. Status defaults to 'pending_confirmation' in the DB.
  create: async (input: NewAppointment): Promise<Appointment> => {
    const { data, error } = await supabase
      .from("appointments")
      .insert(input)
      .select(APPOINTMENT_COLUMNS)
      .single()
    if (error) throw error
    return data as unknown as Appointment
  },

  // Update an appointment (status change or reschedule). Returns the fresh row.
  update: async (
    id: string,
    patch: AppointmentUpdate
  ): Promise<Appointment> => {
    const { data, error } = await supabase
      .from("appointments")
      .update(patch)
      .eq("id", id)
      .select(APPOINTMENT_COLUMNS)
      .single()
    if (error) throw error
    return data as unknown as Appointment
  },
}

export default appointmentsService
