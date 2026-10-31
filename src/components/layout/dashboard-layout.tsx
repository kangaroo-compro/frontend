import { Outlet } from 'react-router-dom'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppSidebar } from '@/components/layout/app-sidebar'

export function DashboardLayout() {
  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen>
        <AppSidebar />
        <SidebarInset className="min-h-svh bg-background flex flex-col w-full min-w-0">
          {/* Mobile top bar to toggle sidebar */}
          <header className="flex h-14 items-center gap-3 border-b px-4 md:hidden">
            <SidebarTrigger />
            <span className="text-sm font-semibold tracking-tight">Kangaroo Compro</span>
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
