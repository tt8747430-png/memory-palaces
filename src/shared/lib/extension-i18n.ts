import { useTranslation } from 'react-i18next'

/**
 * Resolves a key an extension contributed — namespaced, as in `<namespace>:label`.
 *
 * i18next's key types come from `CustomTypeOptions`, which core declares over the `translation`
 * namespace alone; core may not name an extension's namespace, so a contributed key is opaque to
 * those types by design. This is the one place that reconnects the two, rather than a cast at
 * every host that renders a contribution.
 */
export type ContributedT = (key: string, options?: Record<string, unknown>) => string

export function useContributedT(): ContributedT {
  const { t } = useTranslation()
  return t as unknown as ContributedT
}
