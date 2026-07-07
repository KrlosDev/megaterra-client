import { createFileRoute } from '@tanstack/react-router'
import { LoginForm } from "@/components/login-form"
import { logo, heroImage } from "@/assets"

export const Route = createFileRoute('/login/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    // Left column carries the same branded surface as the pipeline board
    // (green→black gradient + tinted topography texture) with the form floating
    // in a glassmorphism card; right column keeps the hero image. The brand text
    // sits on the dark surface, so it uses the always-light primary-foreground
    // token (not theme-flipping foreground).
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="pipeline-surface flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <span className="flex items-center gap-2 font-medium text-primary-foreground">
            <div className="flex size-6 items-center justify-center overflow-hidden rounded-md">
              <img src={logo} alt="Logo" className="size-full object-cover" />
            </div>
            Megaterra
          </span>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm rounded-xl bg-card/60 p-6 shadow-xl ring-1 ring-foreground/10 backdrop-blur-md md:p-8">
            <LoginForm />
          </div>
        </div>
      </div>

      <div className="relative hidden bg-muted lg:block">
        <img
          src={heroImage}
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  )
}
