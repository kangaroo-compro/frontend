import { PERMISSIONS } from '@/features/accounts/permissions'
import { useCan } from '@/features/auth/access'
import { ReportHistory } from '@/features/reports/components/report-history'

export function ReportPage() {
  const canRead = useCan(PERMISSIONS.report)

  return (
    <div className="flex w-full flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Report</h1>
      </header>
      {canRead ? <ReportHistory /> : <p className="text-sm text-muted-foreground">You don't have access to this page.</p>}
    </div>
  )
}
