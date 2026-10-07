import type { ReactNode } from 'react'

type StatTileProps = {
  label: string
  value: ReactNode
  detail?: ReactNode
}

export function StatTile({ label, value, detail }: StatTileProps) {
  return (
    <div className="viz-card flex flex-col gap-1 p-4">
      <span className="text-sm" style={{ color: 'var(--viz-ink-secondary)' }}>
        {label}
      </span>
      <span className="text-2xl font-semibold" style={{ color: 'var(--viz-ink)' }}>
        {value}
      </span>
      {detail && (
        <span className="text-xs" style={{ color: 'var(--viz-ink-muted)' }}>
          {detail}
        </span>
      )}
    </div>
  )
}
