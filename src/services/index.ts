export { default as supabase } from "./supabase"
export { authService } from "./auth.service"
export type { Profile, AppRole, IdType } from "./auth.service"
export { projectsService } from "./projects.service"
export type {
  Project,
  NewProject,
  ProjectStatus,
  ProjectRecordStatus,
  SizeType,
} from "./projects.service"
export { leadsService } from "./leads.service"
export type {
  Lead,
  NewLead,
  LeadStage,
  LeadTemperature,
  LeadProject,
  LeadAdvisor,
} from "./leads.service"
export { inventoryService } from "./inventory.service"
export type {
  InventoryUnit,
  NewInventoryUnit,
  InventoryStatus,
  UnitType,
  InventoryProject,
} from "./inventory.service"
export { notesService } from "./notes.service"
export type { LeadNote, NewLeadNote } from "./notes.service"
export { quotesService } from "./quotes.service"
export type {
  Quote,
  NewQuote,
  QuoteLead,
  QuoteProject,
  QuoteUnit,
  QuoteAdvisor,
} from "./quotes.service"
export { appointmentsService } from "./appointments.service"
export type {
  Appointment,
  NewAppointment,
  AppointmentUpdate,
  AppointmentStatus,
  AppointmentType,
  AppointmentProject,
  AppointmentLead,
  AppointmentAdvisor,
} from "./appointments.service"
