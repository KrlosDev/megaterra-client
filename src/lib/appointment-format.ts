import { MapPinIcon, PhoneIcon, VideoIcon, type LucideIcon } from "lucide-react"
import type { AppointmentStatus, AppointmentType } from "@/services"

/** Human-readable labels for the appointment_status enum values. */
export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending_confirmation: "Pending Confirmation",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  showed_up: "Showed Up",
  no_show: "No Show",
  rescheduled: "Rescheduled",
}

/** Tailwind background classes for the colored status dot in the calendar. */
export const APPOINTMENT_STATUS_DOT_COLORS: Record<AppointmentStatus, string> = {
  pending_confirmation: "bg-amber-500",
  confirmed: "bg-green-500",
  cancelled: "bg-red-500",
  showed_up: "bg-emerald-700",
  no_show: "bg-rose-400",
  rescheduled: "bg-blue-500",
}

/** Human-readable labels for the appointment_type enum values. */
export const APPOINTMENT_TYPE_LABELS: Record<AppointmentType, string> = {
  in_person: "In Person",
  call: "Call",
  zoom: "Zoom",
}

/** Lucide icon per appointment type, used in the list view. */
export const APPOINTMENT_TYPE_ICONS: Record<AppointmentType, LucideIcon> = {
  in_person: MapPinIcon,
  call: PhoneIcon,
  zoom: VideoIcon,
}

export const APPOINTMENT_STATUS_OPTIONS = Object.keys(
  APPOINTMENT_STATUS_LABELS
) as AppointmentStatus[]

export const APPOINTMENT_TYPE_OPTIONS = Object.keys(
  APPOINTMENT_TYPE_LABELS
) as AppointmentType[]
