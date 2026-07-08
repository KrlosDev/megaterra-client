import { useTranslation } from "react-i18next"
import type { AppointmentStatus } from "@/services"
import { APPOINTMENT_STATUS_DOT_COLORS } from "@/lib/appointment-format"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

/**
 * Status badge that shares the exact colors used by the calendar dots
 * (APPOINTMENT_STATUS_DOT_COLORS), so a status looks the same everywhere it
 * appears — calendar, list, and detail sheet.
 */
export function AppointmentStatusBadge({
  status,
  className,
}: {
  status: AppointmentStatus
  className?: string
}) {
  const { t } = useTranslation()
  return (
    <Badge variant="outline" className={cn("gap-1.5", className)}>
      <span
        className={cn(
          "size-2 rounded-full",
          APPOINTMENT_STATUS_DOT_COLORS[status]
        )}
      />
      {t(`appointments.statuses.${status}`)}
    </Badge>
  )
}
