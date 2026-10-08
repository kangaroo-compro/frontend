import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatBytes, formatClock, formatPercent } from '@/lib/format'
import type { Sample } from '../types'

const ROWS = 15

/** Table view of the charts: the latest samples, newest first. */
export function MetricsTable({ samples }: { samples: Sample[] }) {
  return (
    <Card className="py-0">
      <Table className="tabular-nums">
        <TableCaption className="sr-only">Last {ROWS} samples, newest first</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>CPU</TableHead>
            <TableHead>Memory used</TableHead>
            <TableHead>Swap used</TableHead>
            <TableHead>Container memory</TableHead>
            <TableHead>Latency</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {samples
            .slice(-ROWS)
            .reverse()
            .map((s) => (
              <TableRow key={s.sampledAt}>
                <TableCell>{formatClock(s.sampledAt)}</TableCell>
                <TableCell>{formatPercent(s.snapshot.host.cpu_percent)}</TableCell>
                <TableCell>{formatBytes(s.snapshot.host.memory_used_bytes)}</TableCell>
                <TableCell>{formatBytes(s.snapshot.host.swap_used_bytes)}</TableCell>
                <TableCell>{formatBytes(s.snapshot.manager.memory_bytes)}</TableCell>
                <TableCell>{Math.max(s.receivedAt - s.sampledAt, 0)} ms</TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </Card>
  )
}
