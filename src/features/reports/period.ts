const MAX_PERIOD_MS = 31 * 24 * 3_600_000

/** Why a report period is not allowed, or null. The Manager enforces the same rule. */
export function periodError(from: Date, to: Date): string | null {
  if (to <= from) return 'The end must be after the start.'
  if (to.getTime() - from.getTime() > MAX_PERIOD_MS) return 'A report can span at most 31 days.'
  return null
}
