import { Power, TriangleAlert } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ControlCardProps {
  status?: 'ON' | 'OFF'
}

export function ControlCard({ status = 'ON' }: ControlCardProps) {
  const isMachineOn = status === 'ON'

  return (
    <Card className="rounded-xl border bg-card shadow-xs w-full h-full flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between pb-3 p-5">
        <CardTitle className="text-lg font-bold tracking-tight text-foreground">
          ON/OFF Control
        </CardTitle>
        <Badge
          variant="secondary"
          className="rounded-full px-3 py-0.5 text-xs font-medium"
        >
          You are authorized
        </Badge>
      </CardHeader>

      <CardContent className="space-y-5 p-5 pt-0">
        <p className="text-xs text-muted-foreground leading-relaxed">
          ON and OFF commands only. Speed, pressure, and set points cannot be changed from the dashboard.
        </p>

        {/* Command Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            disabled={isMachineOn}
            className={`gap-2 rounded-lg font-medium ${
              isMachineOn ? 'opacity-50 cursor-not-allowed' : 'border-foreground/30 hover:border-foreground'
            }`}
          >
            <Power className="size-4" aria-hidden />
            Turn ON
          </Button>

          <Button
            variant="outline"
            disabled={!isMachineOn}
            className={`gap-2 rounded-lg font-medium ${
              !isMachineOn ? 'opacity-50 cursor-not-allowed' : 'border-foreground/30 hover:border-foreground'
            }`}
          >
            <Power className="size-4" aria-hidden />
            Turn Off
          </Button>
        </div>

        {/* Last Command Audit */}
        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-foreground">Last Command</h4>
          <p className="text-xs text-muted-foreground">ON · 08:02:11 · Andi Pratama</p>
        </div>

        {/* Safety Disclaimer Banner */}
        <Alert className="rounded-xl border border-muted-foreground/20 bg-muted/40 p-3 text-muted-foreground">
          <TriangleAlert className="size-4 text-muted-foreground shrink-0" aria-hidden />
          <AlertDescription className="text-[11px] leading-relaxed text-muted-foreground">
            This function does not replace the emergency stop, safety PLC, or the machine's built-in protection. Use it in accordance with PERURI's operating procedures and safety requirements.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
