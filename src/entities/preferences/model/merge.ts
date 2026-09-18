import { mergeFields } from '@/shared/lib'
import { makePreferences, type Preferences } from './types'

/**
 * Two devices' preferences, merged a setting at a time against the version this device last saw
 * (`base`): what this device changed since, it keeps; everything else comes from the other side. So
 * a device holding a stale copy — it switched on dev mode, but never pulled the dark theme set
 * elsewhere — cannot undo the setting it never touched. A setting both changed goes to this device,
 * whose write is the one being made now.
 *
 * With no `base` the device never saw the server's copy: what it changed is what differs from the
 * defaults. The later clock is kept, so the merged document is not refused as older than either.
 */
export function mergePreferences(
  mine: Preferences,
  theirs: Preferences,
  base: Preferences | undefined,
): Preferences {
  const seen = base ?? makePreferences({ id: mine.id, createdAt: mine.createdAt })
  return mergeFields(mine, theirs, seen, { tie: 'mine' })
}
