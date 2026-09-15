export type DataTransition = 'keep' | 'reset'

export function resolveDataTransition(ownerId: string | null, accountId: string): DataTransition {
  return ownerId === null || ownerId === accountId ? 'keep' : 'reset'
}
