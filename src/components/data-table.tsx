import { useId, type ReactNode } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PAGE_SIZE_OPTIONS } from '@/hooks/use-page-size'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export type Column<T> = {
  key: string
  header: ReactNode
  cell: (row: T) => ReactNode
  className?: string
}

export type TableMeta = {
  limit: number
  offset: number
  total: number
}

type Props<T> = {
  data: T[]
  columns: Column<T>[]
  rowKey: (row: T) => string
  empty: ReactNode
  meta?: TableMeta
  page: number
  onPageChange: (page: number) => void
  /** With both, the pager shows "Rows per page". The owner resets to page 1 and refetches. */
  pageSize?: number
  onPageSizeChange?: (size: number) => void
}

export function DataTable<T>({
  data,
  columns,
  rowKey,
  empty,
  meta,
  page,
  onPageChange,
  pageSize,
  onPageSizeChange,
}: Props<T>) {
  const sizeLabelId = useId()
  const totalPages = meta ? Math.ceil(meta.total / meta.limit) : 1
  const startPage = Math.max(1, Math.min(page - 1, totalPages - 2))

  const visiblePages = Array.from(
    { length: Math.min(3, totalPages) },
    (_, index) => startPage + index,
  )

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
              <TableCell
                colSpan={columns.length}
                className="text-center text-muted-foreground"
              >
                {empty}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {meta && meta.total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {pageSize !== undefined && onPageSizeChange ? (
            <div className="flex items-center gap-2 text-sm">
              <span id={sizeLabelId}>Rows per page</span>
              <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
                <SelectTrigger size="sm" aria-labelledby={sizeLabelId} className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <span />
          )}
        <Pagination className="w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(event) => {
                  event.preventDefault()
                  if (page > 1) onPageChange(page - 1)
                }}
                aria-disabled={page === 1}
                className={page === 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>

            {startPage > 1 && (
              <>
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    onClick={(event) => {
                      event.preventDefault()
                      onPageChange(1)
                    }}
                  >
                    1
                  </PaginationLink>
                </PaginationItem>

                {startPage > 2 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
              </>
            )}

            {visiblePages.map((pageNumber) => (
              <PaginationItem key={pageNumber}>
                <PaginationLink
                  href="#"
                  isActive={pageNumber === page}
                  onClick={(event) => {
                    event.preventDefault()
                    onPageChange(pageNumber)
                  }}
                >
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            ))}

            {startPage + visiblePages.length - 1 < totalPages && (
              <>
                {startPage + visiblePages.length < totalPages && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}

                <PaginationItem>
                  <PaginationLink
                    href="#"
                    onClick={(event) => {
                      event.preventDefault()
                      onPageChange(totalPages)
                    }}
                  >
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              </>
            )}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(event) => {
                  event.preventDefault()
                  if (page < totalPages) onPageChange(page + 1)
                }}
                aria-disabled={page === totalPages}
                className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
        </div>
      )}
    </div>
  )
}