import { useEffect, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { LayoutGridIcon, ListIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { appointmentsService, type Appointment } from "@/services"
import { useIsMobile } from "@/hooks/use-mobile"
import { CreateAppointmentSheet } from "@/components/appointments/create-appointment-sheet"
import { AppointmentDetailSheet } from "@/components/appointments/appointment-detail-sheet"
import { AppointmentCalendar } from "@/components/appointments/appointment-calendar"
import { AppointmentList } from "@/components/appointments/appointment-list"
import { HeaderSlot } from "@/components/layout/header-slot"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const Route = createFileRoute("/_authenticated/appointments/")({
  component: RouteComponent,
})

function RouteComponent() {
  const { t } = useTranslation()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Appointment | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // Default to list view on mobile (calendar is cramped on small screens);
  // once the user picks a tab, their choice sticks regardless of viewport.
  const isMobile = useIsMobile()
  const [view, setView] = useState<string | null>(null)
  const activeView = view ?? (isMobile ? "list" : "calendar")

  useEffect(() => {
    let active = true
    appointmentsService
      .list()
      .then((data) => {
        if (active) setAppointments(data)
      })
      .catch((error) => {
        toast.error(
          error instanceof Error ? error.message : t("appointments.loadFailed")
        )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  function handleCreated(appointment: Appointment) {
    setAppointments((prev) => [...prev, appointment])
  }

  function handleUpdated(appointment: Appointment) {
    setAppointments((prev) =>
      prev.map((existing) =>
        existing.id === appointment.id ? appointment : existing
      )
    )
    setSelected(appointment)
  }

  function handleSelect(appointment: Appointment) {
    setSelected(appointment)
    setDetailOpen(true)
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {loading ? (
        <Skeleton className="h-128 w-full" />
      ) : (
        <Tabs value={activeView} onValueChange={setView} className="gap-4">
          {/* Tabs + create button live in the app header (portaled). */}
          <HeaderSlot>
            <TabsList className="h-7">
              <TabsTrigger value="calendar">
                <LayoutGridIcon />
                {t("appointments.calendar")}
              </TabsTrigger>
              <TabsTrigger value="list">
                <ListIcon />
                {t("appointments.list")}
              </TabsTrigger>
            </TabsList>
            <CreateAppointmentSheet onCreated={handleCreated} />
          </HeaderSlot>

          <TabsContent value="calendar">
            <AppointmentCalendar
              appointments={appointments}
              onSelect={handleSelect}
            />
          </TabsContent>

          <TabsContent value="list">
            <AppointmentList
              appointments={appointments}
              onSelect={handleSelect}
            />
          </TabsContent>
        </Tabs>
      )}

      <AppointmentDetailSheet
        appointment={selected}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdated={handleUpdated}
      />
    </div>
  )
}
