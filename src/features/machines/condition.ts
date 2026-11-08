import type { Readings } from '@/features/telemetry/types'
import type { Range, Thresholds } from './types'

export type Condition = 'Normal' | 'Abnormal'

/** A band of 0/0 means the thresholds were never set. */
function outside(value: number | undefined, band: Range): boolean {
  return value !== undefined && !(band.min === 0 && band.max === 0) && (value < band.min || value > band.max)
}

/**
 * Same rule as `domain.Abnormal` in the Manager: abnormal when temperature or pressure is outside its
 * band. Null when there is neither reading, so the screen shows — instead of a made-up "Normal".
 */
export function condition(readings: Readings, thresholds: Thresholds): Condition | null {
  if (readings.temperature === undefined && readings.pressure === undefined) return null
  return outside(readings.temperature, thresholds.temperature) || outside(readings.pressure, thresholds.pressure)
    ? 'Abnormal'
    : 'Normal'
}
