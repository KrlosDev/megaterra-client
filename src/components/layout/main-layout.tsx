import { AppSidebar } from "@/components/app-sidebar"
import { NavUser } from "@/components/nav-user"
import { QuoterSheet } from "@/components/quoter/quoter-sheet"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { usePageTitle } from "@/hooks/use-page-title"
import { CurrentUserProvider } from "@/components/layout/current-user"
import {
  HeaderSlotProvider,
  HeaderSlotTarget,
} from "@/components/layout/header-slot"

export default function MainLayout({children,}: {children: React.ReactNode}) {
  const title = usePageTitle()

  return (
    <CurrentUserProvider>
      <HeaderSlotProvider>
        <SidebarProvider className="h-svh overflow-hidden">
          <AppSidebar />
          <SidebarInset className="min-h-0 overflow-hidden md:peer-data-[variant=inset]:rounded-sm">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator
                  orientation="vertical"
                  className="mr-2 data-[orientation=vertical]:h-6"
                />
                <h1 className="text-base font-medium">{title}</h1>
              </div>
              <div className="ml-auto flex items-center gap-2 px-4">
                {/* Pages inject page-specific actions here via <HeaderSlot>. */}
                <HeaderSlotTarget className="flex items-center gap-2" />
                <QuoterSheet />
                <ThemeSwitcher />
                <NavUser />
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </HeaderSlotProvider>
    </CurrentUserProvider>
  )
}
