import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PERMISSIONS } from '@/features/accounts/permissions'
import { useCan } from '@/features/auth/access'
import { ReportHistory } from '@/features/reports/components/report-history'

export function ReportPage() {
  const canRead = useCan(PERMISSIONS.report)
  const canGenerate = useCan(PERMISSIONS.reportGenerate)

  return (
    <div className="flex w-full flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Report</h1>
        {canRead && canGenerate && (
          <Button asChild>
            <Link to="/report/new">
              <Plus /> Generate report
            </Link>
          </Button>
        )}
      </header>
      {canRead ? <ReportHistory /> : <p className="text-sm text-muted-foreground">You don't have access to this page.</p>}
    </div>
  )
}
