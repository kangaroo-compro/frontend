import type { CommandAck } from './types'

/** ACCEPTED only means the HMI took the command; every other result ends it. */
export function isFinalAck(ack: CommandAck | undefined): boolean {
  return ack !== undefined && ack.result !== 'ACCEPTED'
}
