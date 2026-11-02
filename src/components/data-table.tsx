import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export type Column<T> = {
  key: string
  header: ReactNode
  cell: (row: T) => ReactNode
  /** Applied to the header and to every cell of the column. */
  className?: string
}

/** Paging info the Manager returns next to a list. */
export type TableMeta = { limit: number; offset: number; total: number }

type Props<T> = {
  data: T[]
  columns: Column<T>[]
  rowKey: (row: T) => string
  /** Rendered in place of the rows when there are none. */
  empty: ReactNode
  /** With meta the table shows "loaded of total" and, while more rows exist, a Load more button. */
  meta?: TableMeta
  onLoadMore?: () => void
  loadingMore?: boolean
}

export function DataTable<T>({ data, columns, rowKey, empty, meta, onLoadMore, loadingMore }: Props<T>) {
  const hasMore = meta !== undefined && data.length < meta.total

  return (
    <div className="flex flex-col gap-3">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((c) => (
              <TableHead key={c.key} className={c.className}>
                {c.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={rowKey(row)}>
              {columns.map((c) => (
                <TableCell key={c.key} className={c.className}>
                  {c.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
          {data.length === 0 && (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center text-muted-foreground">
                {empty}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {meta && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">
            {data.length} of {meta.total}
          </span>
          {hasMore && onLoadMore && (
            <Button variant="outline" onClick={onLoadMore} disabled={loadingMore}>
              {loadingMore ? 'Loading…' : 'Load more'}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
