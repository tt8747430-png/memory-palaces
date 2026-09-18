import { useContributedT } from '@/shared/lib'
import type { bibleMessages } from './en'

/** `kept_one` / `kept_other` are one key to a caller: i18next picks the form from `count`. */
type Singular<Key extends string> = Key extends `${infer Base}_${'one' | 'other'}` ? Base : Key

export type BibleKey = Singular<keyof typeof bibleMessages & string>

export type BibleT = (key: BibleKey, options?: Record<string, unknown>) => string

/**
 * The extension's own `t`, typed to its own message keys. The namespace is applied here, so a
 * caller writes `t('label')` and never the `bible:` prefix — and nothing in the extension casts.
 */
export function useBibleT(): BibleT {
  const t = useContributedT()
  return (key, options) => t(`bible:${key}`, options)
}
