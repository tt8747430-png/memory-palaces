import { useTranslation } from 'react-i18next'
import { Check, Heart, Layers, ListFilter, Sparkles, SquareStack } from 'lucide-react'
import { type DeckSort, useContributedT, useExtensionPoint } from '@/shared/lib'
import {
  EmptyNotice,
  FilterChip,
  SortControl,
  type SortControlOption,
  useDeckSortOptions,
} from '@/shared/ui'
import {
  CORE_LIBRARY_FILTERS,
  type CoreLibraryFilter,
  type LibraryFilter,
} from '../model/library-filter'

export interface LibrarySelectBarProps {
  /** The deck whose subdecks are on the list, while one is; the whole Library otherwise. */
  scopeName: string | null
  sort: DeckSort
  onSortChange: (sort: DeckSort) => void
  filter: LibraryFilter
  onFilterChange: (filter: LibraryFilter) => void
  allSubdecks: boolean
  onAllSubdecksChange: (on: boolean) => void
  shown: number
  hidden: number
}

const FILTER_ICON: Record<CoreLibraryFilter, typeof Heart> = {
  all: ListFilter,
  favorites: Heart,
  due: Sparkles,
}

/**
 * How the rows are arranged while a selection is on: their order, which of them are shown, and
 * whether the Library order reaches every subdeck. Only here — arranging is something done while
 * choosing among rows, not while reading them.
 */
export function LibrarySelectBar({
  scopeName,
  sort,
  onSortChange,
  filter,
  onFilterChange,
  allSubdecks,
  onAllSubdecksChange,
  shown,
  hidden,
}: LibrarySelectBarProps) {
  const { t } = useTranslation()
  const contributed = useContributedT()
  const sortOptions = useDeckSortOptions()
  const extra = useExtensionPoint('deckFilters')
  const filterOptions: SortControlOption<LibraryFilter>[] = [
    ...CORE_LIBRARY_FILTERS.map((value) => {
      const Icon = FILTER_ICON[value]
      return { value, label: t(`deck.filter.${value}`), icon: <Icon className="size-4" /> }
    }),
    ...extra.map((filter, at) => ({
      value: filter.id,
      label: contributed(filter.labelKey),
      icon: filter.icon,
      dividerBefore: at === 0,
    })),
  ]

  return (
    <div className="flex flex-col gap-2">
      {scopeName ? (
        <p className="flex items-center gap-1.5 px-1 text-label font-semibold text-heading">
          <Layers className="size-4 shrink-0 text-accent" aria-hidden />
          {t('deck.subdecksOf', { name: scopeName })}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <SortControl
          label={t('deck.sortLabel')}
          value={sort}
          options={sortOptions}
          onChange={onSortChange}
        />
        <SortControl
          label={t('deck.filterLabel')}
          value={filter}
          options={filterOptions}
          onChange={onFilterChange}
        />
        <FilterChip
          label={t('deck.allSubdecks')}
          icon={<Check aria-hidden />}
          offIcon={<SquareStack aria-hidden />}
          on={allSubdecks}
          onChange={onAllSubdecksChange}
        />
      </div>

      {hidden > 0 ? (
        <p className="px-1 text-tiny font-semibold text-muted-foreground" role="status">
          {t('deck.filterHidden', { shown, total: shown + hidden })}
        </p>
      ) : null}

      {/* A filter that keeps nothing has to say so: an empty list beside a "0 of 8" would read
          as a Library that had lost its decks. */}
      {shown === 0 && hidden > 0 ? <EmptyNotice>{t('deck.filterEmpty')}</EmptyNotice> : null}
    </div>
  )
}
