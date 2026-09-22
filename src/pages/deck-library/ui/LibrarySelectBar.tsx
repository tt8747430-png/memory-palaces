import { useTranslation } from 'react-i18next'
import { Check, Heart, Layers, ListFilter, Sparkles, SquareStack } from 'lucide-react'
import { type DeckSort, useContributedT, useExtensionPoint } from '@/shared/lib'
import {
  EmptyNotice,
  FilterChip,
  offeredOptions,
  OPTION_GROUP,
  SortControl,
  type SortControlOption,
  useDeckSortOptions,
} from '@/shared/ui'
import type { ArrangeOptions } from '../model/use-arrange-options'
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
  /** Which orders and filters can change this list — anything else is not put on offer. */
  options: ArrangeOptions
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
 *
 * Every control here earns its place. An order that would leave these rows as they are, a filter
 * that matches none of them, a switch with no subdeck to reach: none is drawn, so the row says what
 * this Library can do rather than what the app can do. The one exception is the applied option,
 * which stays listed even at zero so the learner can undo it (`offeredOptions`).
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
  options,
}: LibrarySelectBarProps) {
  const { t } = useTranslation()
  const contributed = useContributedT()
  const extra = useExtensionPoint('deckFilters')
  const sortOptions = offeredOptions(useDeckSortOptions(), options.sorts, sort)
  const filterOptions = offeredOptions(
    [
      ...CORE_LIBRARY_FILTERS.map((value) => {
        const Icon = FILTER_ICON[value]
        return {
          value,
          label: t(`deck.filter.${value}`),
          icon: <Icon className="size-4" />,
          group: OPTION_GROUP.core,
        }
      }),
      ...extra.map((each) => ({
        value: each.id,
        label: contributed(each.labelKey),
        icon: each.icon,
        group: OPTION_GROUP.contributed,
      })),
    ] satisfies SortControlOption<LibraryFilter>[],
    options.filters,
    filter,
  )

  const showSort = options.canSort && sortOptions.length > 1
  const showFilter = options.canFilter && filterOptions.length > 1

  return (
    <div className="flex flex-col gap-2">
      {scopeName ? (
        <p className="flex items-center gap-1.5 px-1 text-label font-semibold text-heading">
          <Layers className="size-4 shrink-0 text-accent" aria-hidden />
          {t('deck.subdecksOf', { name: scopeName })}
        </p>
      ) : null}

      {showSort || showFilter || options.canAllSubdecks ? (
        <div className="flex flex-wrap items-center gap-2">
          {showSort ? (
            <SortControl
              label={t('deck.sortLabel')}
              value={sort}
              options={sortOptions}
              onChange={onSortChange}
            />
          ) : null}
          {showFilter ? (
            <SortControl
              label={t('deck.filterLabel')}
              value={filter}
              options={filterOptions}
              onChange={onFilterChange}
            />
          ) : null}
          {options.canAllSubdecks ? (
            <FilterChip
              label={t('deck.allSubdecks')}
              icon={<Check aria-hidden />}
              offIcon={<SquareStack aria-hidden />}
              on={allSubdecks}
              onChange={onAllSubdecksChange}
            />
          ) : null}
        </div>
      ) : null}

      {hidden > 0 ? (
        <p className="px-1 text-tiny font-semibold text-muted-foreground" role="status">
          {t('deck.filterHidden', { shown, total: shown + hidden })}
        </p>
      ) : null}

      {/* A filter that keeps nothing has to say so: an empty list beside a "0 of 8" would read
          as a Library that had lost its decks. This is also where an applied filter that has run
          out of rows lands — it stays on offer above, and this says why the list is bare. */}
      {shown === 0 && hidden > 0 ? <EmptyNotice>{t('deck.filterEmpty')}</EmptyNotice> : null}
    </div>
  )
}
