import { useQuery } from '@tanstack/react-query'
import { ChevronDown, LogOut, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NO_VALUE } from '@/lib/format'
import { getMe } from '../api'
import { initials } from '../initials'
import { signOutEverywhere } from '../session'

/** Role and name of the signed-in user, from GET /me. It opens the user menu: Profile and Sign out. */
export function UserPill() {
  const me = useQuery({ queryKey: ['me'], queryFn: getMe, staleTime: Infinity })

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="User menu"
          className="flex cursor-pointer items-center gap-3 rounded-full border bg-muted/40 py-1.5 pl-2 pr-3 shadow-2xs outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=open]:bg-muted"
        >
          <Avatar className="size-8 border bg-muted">
            <AvatarFallback className="bg-muted-foreground/20 text-xs font-semibold text-foreground">
              {me.data ? initials(me.data.name) : NO_VALUE}
            </AvatarFallback>
          </Avatar>
          <span className="flex flex-col text-left leading-tight">
            <span className="text-[11px] text-muted-foreground">{me.data?.role_name ?? NO_VALUE} :</span>
            <span className="text-xs font-semibold text-foreground">{me.data?.name ?? NO_VALUE}</span>
          </span>
          <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem asChild>
          <Link to="/profile">
            <User /> Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => signOutEverywhere()}>
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
