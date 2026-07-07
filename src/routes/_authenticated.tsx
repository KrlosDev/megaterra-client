import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { authService } from '@/services'
import { useAuthStore } from '@/stores/auth-store'
import MainLayout from '@/components/layout/main-layout'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    const session = await authService.getSession()
    // const session = true //for testing purposes, comment out the above line and uncomment this one to bypass authentication
    if (!session) {
      throw redirect({ to: '/' })
    }
    // Hydrate the profile so a page refresh keeps conditional rendering working.
    if (!useAuthStore.getState().profile) {
      await useAuthStore.getState().loadProfile()
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  )
}
