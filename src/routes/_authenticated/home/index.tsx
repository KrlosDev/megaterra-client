import { createFileRoute } from "@tanstack/react-router"
import { useAuthStore } from "@/stores/auth-store"
import { Loader } from "@/components/ui/loader"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const Route = createFileRoute("/_authenticated/home/")({
  component: RouteComponent,
})

const ID_TYPE_LABELS: Record<string, string> = {
  national_id: "National ID",
  passport: "Passport",
}

function RouteComponent() {
  const profile = useAuthStore((state) => state.profile)
  const isLoading = useAuthStore((state) => state.isLoading)

  if (isLoading && !profile) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader />
      </div>
    )
  }

  if (!profile) {
    return <div className="text-muted-foreground">No profile found.</div>
  }

  const fields: { label: string; value: string }[] = [
    { label: "Display name", value: profile.display_name ?? "—" },
    { label: "Email", value: profile.email },
    { label: "Role", value: profile.role ?? "—" },
    { label: "Phone number", value: profile.phone_number ?? "—" },
    { label: "ID number", value: profile.id_number ?? "—" },
    {
      label: "ID type",
      value: profile.id_type ? ID_TYPE_LABELS[profile.id_type] : "—",
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center py-8">
        <Loader className="text-2xl" />
      </div>
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>
            Welcome{profile.display_name ? `, ${profile.display_name}` : ""}
          </CardTitle>
          <CardDescription>Your profile</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-2 text-sm">
            {fields.map((field) => (
              <div key={field.label} className="contents">
                <dt className="text-muted-foreground">{field.label}</dt>
                <dd className="font-medium capitalize">{field.value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
