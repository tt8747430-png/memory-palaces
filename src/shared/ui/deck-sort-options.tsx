import { useTranslation } from 'react-i18next'
import { ArrowDownAZ, Clock, GripVertical, Sparkles } from 'lucide-react'
import { DECK_SORTS, type DeckSort } from '@/shared/lib'
import type { SortControlOption } from './SortControl'

const META: Record<DeckSort, { labelKey: string; icon: typeof Clock }> = {
  manual: { labelKey: 'deck.sort.manual', icon: GripVertical },
  name: { labelKey: 'deck.sort.name', icon: ArrowDownAZ },
  recent: { labelKey: 'deck.sort.recent', icon: Clock },
  due: { labelKey: 'deck.sort.due', icon: Sparkles },
}

export function useDeckSortOptions(): SortControlOption<DeckSort>[] {
  const { t } = useTranslation()
  return DECK_SORTS.map((value) => {
    const { labelKey, icon: Icon } = META[value]
    return { value, label: t(labelKey as never), icon: <Icon className="size-4" /> }
  })
}
