import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'

type StatTileProps = {
  label: string
  value: ReactNode
  detail?: ReactNode
}

export function StatTile({ label, value, detail }: StatTileProps) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-2xl font-semibold">{value}</span>
        {detail && <span className="text-xs text-muted-foreground">{detail}</span>}
      </CardContent>
    </Card>
  )
}
