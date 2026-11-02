import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PERMISSIONS } from '@/features/accounts/permissions'
import { useCan } from '@/features/auth/access'
import { ReportForm } from '@/features/reports/components/report-form'
import { ReportPreview } from '@/features/reports/components/report-preview'

export function ReportNewPage() {
  const canGenerate = useCan(PERMISSIONS.reportGenerate)

  return (
    <div className="flex w-full flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link to="/report" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to reports
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Generate report</h1>
      </header>
      {canGenerate ? (
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <ReportForm />
          <ReportPreview />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">You don't have access to this page.</p>
      )}
    </div>
  )
}
