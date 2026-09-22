import { useTranslation } from 'react-i18next'
import { ArrowDownAZ, Clock, Flag, GripVertical, Sparkles } from 'lucide-react'
import {
  type ContentSort,
  CORE_DECK_SORTS,
  type CoreDeckSort,
  type DeckSort,
  useContributedT,
  useExtensionPoint,
} from '@/shared/lib'
import type { SortControlOption } from './SortControl'

interface SortMeta {
  labelKey: string
  icon: typeof Clock
}

/** One `SortControl` option list for any set of orders, given how each is named and drawn. */
function useSortOptions<T extends string>(
  sorts: readonly T[],
  meta: Record<T, SortMeta>,
): SortControlOption<T>[] {
  const { t } = useTranslation()
  return sorts.map((value) => {
    const { labelKey, icon: Icon } = meta[value]
    return { value, label: t(labelKey as never), icon: <Icon className="size-4" /> }
  })
}

const CONTENT_META: Record<ContentSort, SortMeta> = {
  manual: { labelKey: 'cards.sort.manual', icon: GripVertical },
  recent: { labelKey: 'cards.sort.recent', icon: Clock },
  name: { labelKey: 'cards.sort.name', icon: ArrowDownAZ },
  due: { labelKey: 'cards.sort.due', icon: Sparkles },
  flagged: { labelKey: 'cards.sort.flagged', icon: Flag },
}

export function useContentSortOptions<T extends ContentSort>(
  sorts: readonly T[],
): SortControlOption<T>[] {
  return useSortOptions(sorts, CONTENT_META)
}

const DECK_META: Record<CoreDeckSort, SortMeta> = {
  manual: { labelKey: 'deck.sort.manual', icon: GripVertical },
  name: { labelKey: 'deck.sort.name', icon: ArrowDownAZ },
  recent: { labelKey: 'deck.sort.recent', icon: Clock },
  due: { labelKey: 'deck.sort.due', icon: Sparkles },
}

/** The app's own orders, then — after a divider — the ones the enabled extensions contribute. */
export function useDeckSortOptions(): SortControlOption<DeckSort>[] {
  const core = useSortOptions(CORE_DECK_SORTS, DECK_META)
  const contributed = useContributedT()
  const orders = useExtensionPoint('deckSorts')
  return [
    ...core,
    ...orders.map((order, at) => ({
      value: order.id,
      label: contributed(order.labelKey),
      icon: order.icon,
      dividerBefore: at === 0,
    })),
  ]
}
