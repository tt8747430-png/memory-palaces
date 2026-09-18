import { useTranslation } from 'react-i18next'
import type { bibleMessages } from './en'

/** `kept_one` / `kept_other` are one key to a caller: i18next picks the form from `count`. */
type Singular<Key extends string> = Key extends `${infer Base}_${'one' | 'other'}` ? Base : Key

export type BibleKey = Singular<keyof typeof bibleMessages & string>

export type BibleT = (key: BibleKey, options?: Record<string, unknown>) => string

/**
 * The extension's own `t`. i18next's key types come from `CustomTypeOptions`, which core declares
 * over the `translation` namespace alone — and core may not name an extension's namespace, so the
 * one cast that reconnects the two lives here instead of at every call site.
 */
export function useBibleT(): BibleT {
  const { t } = useTranslation('bible' as 'translation')
  return t as unknown as BibleT
}
