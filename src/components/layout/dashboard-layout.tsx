import { Outlet } from 'react-router-dom'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { UserPill } from '@/features/auth/components/user-pill'

export function DashboardLayout() {
  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen>
        <AppSidebar />
        <SidebarInset className="min-h-svh bg-background flex flex-col w-full min-w-0">
          {/* Top bar: the sidebar toggle and title on mobile, the profile pill on every page */}
          <header className="flex min-h-14 items-center gap-3 border-b px-4 py-2 md:justify-end md:border-b-0 md:px-6 md:pb-0 lg:px-8">
            <SidebarTrigger className="md:hidden" />
            <span className="text-sm font-semibold tracking-tight md:hidden">Kangaroo Compro</span>
            <div className="ml-auto md:ml-0">
              <UserPill />
            </div>
          </header>

          {/* Main view - full width without container max-width constraints */}
          <main className="flex-1 w-full min-w-0 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
