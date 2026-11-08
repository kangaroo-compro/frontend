/** Y range that fits the values and the threshold band with 10% padding; empty when there is nothing to fit. */
export function yRange(values: number[], band?: { min: number; max: number }): { yMin?: number; yMax?: number } {
  const all = [...values, ...(band && !(band.min === 0 && band.max === 0) ? [band.min, band.max] : [])]
  if (all.length === 0) return {}
  const lo = Math.min(...all)
  const hi = Math.max(...all)
  const pad = Math.max(hi - lo, 1) * 0.1
  return { yMin: lo - pad, yMax: hi + pad }
}
