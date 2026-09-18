import type { Clocked } from './newest'
import { structurallyEqual } from './structurally-equal'

export interface MergeFieldsOptions<T> {
  /** A field both sides changed: how to settle it. Without a rule, `tie` decides. */
  both?: { [K in keyof T]?: (mine: T[K], theirs: T[K], base: T[K]) => T[K] }
  /** Who wins a field both changed and no rule covers: the newer clock, or this device. */
  tie?: 'newer' | 'mine'
}

/**
 * Two devices' copies of one document, merged a field at a time against the copy both started
 * from: a field only one side changed takes that side; one both changed goes to `both`'s rule,
 * else to the newer clock. So a device that studied a card keeps its review, and the device that
 * fixed a typo keeps the fix — neither whole document wins over the other's work.
 *
 * `_deleted` is a field like any other: a deletion one side made stands unless the other side
 * deleted too, or the tie rule says otherwise. The merged clock is the later one, so neither
 * server nor device refuses it as stale.
 */
export function mergeFields<T extends Clocked>(
  mine: T,
  theirs: T,
  base: T,
  { both = {}, tie = 'newer' }: MergeFieldsOptions<T> = {},
): T {
  const mineNewer = mine.updatedAt >= theirs.updatedAt
  const winner = tie === 'mine' || mineNewer ? mine : theirs
  const keys = new Set([...Object.keys(mine), ...Object.keys(theirs)]) as Set<keyof T & string>
  const merged = {} as T
  for (const key of keys) {
    const mineChanged = !structurallyEqual(mine[key], base[key])
    const theirsChanged = !structurallyEqual(theirs[key], base[key])
    const rule = mineChanged && theirsChanged ? both[key] : undefined
    if (rule) {
      merged[key] = rule(mine[key], theirs[key], base[key])
      continue
    }
    const from = mineChanged && theirsChanged ? winner : mineChanged ? mine : theirs
    // A key the chosen side lacks stays absent — `undefined` would fail the schema.
    if (key in from) merged[key] = from[key]
  }
  merged.updatedAt = mineNewer ? mine.updatedAt : theirs.updatedAt
  return merged
}
