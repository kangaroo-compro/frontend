import { useState } from 'react'

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const

const keyOf = (table: string) => `table.${table}.pageSize`

function read(table: string, fallback: number): number {
  try {
    const n = Number(localStorage.getItem(keyOf(table)))
    return (PAGE_SIZE_OPTIONS as readonly number[]).includes(n) ? n : fallback
  } catch {
    return fallback // storage blocked: use the default
  }
}

/** Rows per page of one table, remembered in this browser under its own key. */
export function usePageSize(table: string, fallback: number): [number, (size: number) => void] {
  const [size, setSize] = useState(() => read(table, fallback))
  function change(next: number) {
    setSize(next)
    try {
      localStorage.setItem(keyOf(table), String(next))
    } catch {
      // storage blocked: the choice lasts until the page is reloaded
    }
  }
  return [size, change]
}
