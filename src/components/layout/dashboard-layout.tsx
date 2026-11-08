import { Outlet } from 'react-router-dom'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { UserPill } from '@/features/auth/components/user-pill'
import { ThemeToggle } from '@/features/theme/theme-toggle'

export function DashboardLayout() {
  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen>
        <AppSidebar />
        <SidebarInset className="min-h-svh bg-background flex flex-col w-full min-w-0">
          {/* Top bar: the sidebar toggle and title on mobile, the profile pill on every page */}
          <header className="flex h-16 shrink-0 items-center gap-3 border-b px-4 md:justify-end md:px-6 lg:px-8">
            <SidebarTrigger className="md:hidden" />
            <span className="text-sm font-semibold tracking-tight md:hidden">Kangaroo Compro</span>
            <div className="ml-auto flex items-center gap-2 md:ml-0">
              <ThemeToggle />
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
