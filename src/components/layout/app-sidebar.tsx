import { Link, useLocation } from 'react-router-dom'
import {
  Cpu,
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  Radio,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { PERMISSIONS } from '@/features/accounts/permissions'
import { useCan } from '@/features/auth/access'
import { signOutEverywhere } from '@/features/auth/session'

const monitoringItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'History',
    url: '/history',
    icon: History,
  },
  {
    title: 'Report',
    url: '/report',
    icon: FileText,
  },
]

const settingsItems = [
  {
    title: 'Manage Machine',
    url: '/manage-machine',
    icon: Cpu,
  },
  {
    title: 'Profile',
    url: '/profile',
    icon: User,
  },
  {
    title: 'Users',
    url: '/users',
    icon: Users,
  },
  {
    title: 'Roles',
    url: '/role',
    icon: ShieldCheck,
  },
]

export function AppSidebar() {
  const location = useLocation()
  const canReadRoles = useCan(PERMISSIONS.roleRead)
  const canReadReports = useCan(PERMISSIONS.report)
  const canReadHistory = useCan(PERMISSIONS.history)
  const canReadUsers = useCan(PERMISSIONS.userRead)
  const canReadMachines = useCan(PERMISSIONS.machineRead)
  const visibleMonitoring = monitoringItems.filter((item) => {
    if (item.url === '/report') return canReadReports
    if (item.url === '/history') return canReadHistory
    return true
  })
  const visibleSettings = settingsItems.filter((item) => {
    if (item.url === '/users') return canReadUsers
    if (item.url === '/role') return canReadRoles
    if (item.url === '/manage-machine') return canReadMachines
    return true
  })

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="flex flex-row items-center justify-between border-b p-4 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2">
        <Link to="/dashboard" className="flex items-center gap-2 font-bold tracking-tight text-foreground">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Radio className="size-4" aria-hidden />
          </div>
          <span className="text-lg font-bold group-data-[collapsible=icon]:hidden">LOGO</span>
        </Link>
        <SidebarTrigger className="group-data-[collapsible=icon]:hidden" />
      </SidebarHeader>

      <SidebarContent className="px-2 py-4 group-data-[collapsible=icon]:px-0">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Monitoring
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMonitoring.map((item) => {
                const isActive =
                  location.pathname === item.url ||
                  location.pathname.startsWith(`${item.url}/`) ||
                  (item.url === '/dashboard' && (location.pathname === '/' || location.pathname === '/dashboard'))
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={isActive ? 'font-medium' : ''}
                    >
                      <Link to={item.url}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Settings
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleSettings.map((item) => {
                const isActive = location.pathname === item.url
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={isActive ? 'font-medium' : ''}
                    >
                      <Link to={item.url}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4 group-data-[collapsible=icon]:p-2">
        <SidebarTrigger className="mx-auto hidden group-data-[collapsible=icon]:inline-flex" />
        <Button
          variant="outline"
          size="sm"
          onClick={signOutEverywhere}
          className="w-full justify-start gap-2 rounded-lg text-xs font-medium group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <LogOut className="size-4" />
          <span className="group-data-[collapsible=icon]:hidden">Sign Out</span>
        </Button>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
