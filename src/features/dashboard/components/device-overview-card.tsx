import { Check, FileUp, LoaderCircle, Power } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ConnectionState } from '../types'

interface DeviceOverviewCardProps {
  selectedDevice?: string
  onSelectDevice?: (deviceId: string) => void
  connectionState?: ConnectionState
  machineStatus?: 'ON' | 'OFF'
}

export function DeviceOverviewCard({
  selectedDevice = 'compressor-1',
  onSelectDevice,
  connectionState = 'live',
  machineStatus = 'ON',
}: DeviceOverviewCardProps) {
  const isOnline = connectionState === 'live'
  const isConnecting = connectionState === 'connecting' || connectionState === 'reconnecting'

  return (
    <Card className="rounded-xl border bg-card shadow-xs w-full">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        {/* Device Information & Badges */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {selectedDevice === 'compressor-2'
              ? 'Compressor 02'
              : selectedDevice === 'compressor-3'
              ? 'Compressor 03'
              : 'Compressor 01'}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium">
              <Power className="size-3.5 stroke-[2.2]" aria-hidden />
              {machineStatus === 'ON' ? 'Machine ON' : 'Machine OFF'}
            </Badge>

            <Badge variant="outline" className="gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium">
              <Check className="size-3.5 stroke-[2.2]" aria-hidden />
              Normal
            </Badge>

            <Badge variant="outline" className="gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium">
              {isConnecting ? (
                <>
                  <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
                  Connecting…
                </>
              ) : isOnline ? (
                <>
                  <span className="size-2 rounded-full bg-foreground" aria-hidden />
                  Device connected
                </>
              ) : (
                <>
                  <span className="size-2 rounded-full bg-destructive" aria-hidden />
                  Offline
                </>
              )}
            </Badge>
          </div>
        </div>

        {/* Action Controls: Selector and Export */}
        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <Select value={selectedDevice} onValueChange={onSelectDevice}>
            <SelectTrigger className="w-[160px] rounded-lg">
              <SelectValue placeholder="Select machine" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="compressor-1">Compressor 1</SelectItem>
              <SelectItem value="compressor-2">Compressor 2</SelectItem>
              <SelectItem value="compressor-3">Compressor 3</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" className="gap-2 rounded-lg font-medium">
            <FileUp className="size-4" aria-hidden />
            Export
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
