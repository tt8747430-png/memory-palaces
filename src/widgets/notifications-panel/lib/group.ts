import { dayKey } from '@/shared/lib'

export type DayBucket = 'today' | 'yesterday' | 'earlier'

const MINUTE = 60_000
const HOUR = 3_600_000
const DAY = 86_400_000

/** Which day-section a notification belongs to (UTC day keys, matching the streak
 * logic). The panel renders sections in today → yesterday → earlier order. */
export function bucketOf(iso: string, now: number): DayBucket {
  const at = dayKey(new Date(iso).getTime())
  if (at === dayKey(now)) return 'today'
  if (at === dayKey(now - DAY)) return 'yesterday'
  return 'earlier'
}

/** A structured (language-neutral) relative timestamp; the panel renders it via i18n
 * so copy stays translatable. Beyond a week it falls back to an absolute date. */
export type RelativeTime =
  | { unit: 'now' }
  | { unit: 'minutes'; value: number }
  | { unit: 'hours'; value: number }
  | { unit: 'days'; value: number }
  | { unit: 'date'; iso: string }

export function relativeTime(iso: string, now: number): RelativeTime {
  const diff = now - new Date(iso).getTime()
  if (diff < MINUTE) return { unit: 'now' }
  if (diff < HOUR) return { unit: 'minutes', value: Math.floor(diff / MINUTE) }
  if (diff < DAY) return { unit: 'hours', value: Math.floor(diff / HOUR) }
  if (diff < 7 * DAY) return { unit: 'days', value: Math.floor(diff / DAY) }
  return { unit: 'date', iso }
}
