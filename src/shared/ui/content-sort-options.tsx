import { useTranslation } from 'react-i18next'
import { ArrowDownAZ, Clock, Flag, GripVertical, Sparkles } from 'lucide-react'
import type { ContentSort } from '@/shared/lib'
import type { SortControlOption } from './SortControl'

const META: Record<ContentSort, { labelKey: string; icon: typeof Clock }> = {
  manual: { labelKey: 'cards.sort.manual', icon: GripVertical },
  recent: { labelKey: 'cards.sort.recent', icon: Clock },
  name: { labelKey: 'cards.sort.name', icon: ArrowDownAZ },
  due: { labelKey: 'cards.sort.due', icon: Sparkles },
  flagged: { labelKey: 'cards.sort.flagged', icon: Flag },
}

/**
 * How each content sort is labelled and drawn. A list offers the subset it can
 * honour — a question has no schedule and no flag — but every list that offers
 * a sort names it and draws it the same way.
 */
export function useContentSortOptions<T extends ContentSort>(
  sorts: readonly T[],
): SortControlOption<T>[] {
  const { t } = useTranslation()
  return sorts.map((value) => {
    const { labelKey, icon: Icon } = META[value]
    return { value, label: t(labelKey as never), icon: <Icon className="size-4" /> }
  })
}
