import { useQuery } from '@tanstack/react-query'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { NO_VALUE } from '@/lib/format'
import { getMe } from '../api'

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

/** Role and name of the signed-in user, from GET /me. Every page under the layout shows it. */
export function UserPill() {
  const me = useQuery({ queryKey: ['me'], queryFn: getMe, staleTime: Infinity })

  return (
    <div className="flex items-center gap-3 rounded-full border bg-muted/40 py-1.5 pl-2 pr-4 shadow-2xs">
      <Avatar className="size-8 border bg-muted">
        <AvatarFallback className="bg-muted-foreground/20 text-xs font-semibold text-foreground">
          {me.data ? initials(me.data.name) : NO_VALUE}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col text-left leading-tight">
        <span className="text-[11px] text-muted-foreground">{me.data?.role_name ?? NO_VALUE} :</span>
        <span className="text-xs font-semibold text-foreground">{me.data?.name ?? NO_VALUE}</span>
      </div>
    </div>
  )
}
