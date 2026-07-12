import { type CSSProperties, type ReactNode, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  ChevronRight,
  Folder,
  Layers,
  RotateCcw,
  WalletCards,
} from 'lucide-react'
import {
  selectEffectivePreferences,
  usePreferencesStore,
  usePreferencesStoreApi,
} from '@/entities/preferences'
import { setPreferences } from '@/features/preferences'
import {
  DEFAULT_SWIPE,
  normalizeSwipeConfig,
  SWIPE_ACCENT,
  SWIPE_ACTION_META,
  SWIPE_ACTIONS,
  SWIPE_ITEM_TYPES,
  SWIPE_SIDE_MAX,
  type SwipeActionId,
  type SwipeConfig,
  type SwipeItemType,
} from '@/shared/config/swipe'
import {
  AppScreen,
  Button,
  cardSurface,
  ScreenHeader,
  SegmentedControl,
  swipeActionIcon,
} from '@/shared/ui'
import { cn } from '@/shared/lib'

const TYPE_ICON: Record<SwipeItemType, typeof Layers> = {
  deck: Layers,
  folder: Folder,
  card: WalletCards,
}

/** Resolved accent for a swipe action — the shared source of truth for its
 *  solid fill (preview caps) and its tinted chip (`--sw` custom property). */
function accentOf(id: SwipeActionId) {
  return SWIPE_ACCENT[SWIPE_ACTION_META[id].accent]
}

export interface SettingsSwipePageProps {
  onBack?: () => void
}

export function SettingsSwipePage({ onBack }: SettingsSwipePageProps) {
  const { t } = useTranslation()
  const store = usePreferencesStoreApi()
  const prefs = usePreferencesStore(selectEffectivePreferences)
  const [type, setType] = useState<SwipeItemType>('deck')

  useEffect(() => {
    store.getState().start()
  }, [store])

  const save = (next: SwipeConfig) =>
    void setPreferences(store, {
      swipe: { ...prefs.swipe, [type]: normalizeSwipeConfig(type, next) },
    })

  const toggle = (side: keyof SwipeConfig, id: SwipeActionId) => {
    const current = prefs.swipe[type]
    const list = current[side]
    const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
    save({ ...current, [side]: next })
  }

  const resetAll = () => void setPreferences(store, { swipe: DEFAULT_SWIPE })

  const config = prefs.swipe[type]

  return (
    <AppScreen
      fill
      header={
        <ScreenHeader title={t('swipe.title')} onBack={onBack} backLabel={t('settings.back')} />
      }
    >
      <div className="mt-3 flex flex-col gap-4 pb-24">
        <p className="flex items-start gap-2 px-1 text-[length:var(--p-text-label)] leading-relaxed text-muted-foreground">
          <ArrowLeftRight className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          {t('swipe.subtitle')}
        </p>

        <SegmentedControl
          aria-label={t('swipe.title')}
          value={type}
          onChange={setType}
          size="sm"
          options={SWIPE_ITEM_TYPES.map((value) => {
            const Icon = TYPE_ICON[value]
            return {
              value,
              ariaLabel: t(`swipe.types.${value}` as never),
              label: (
                <span className="flex items-center gap-1.5">
                  <Icon className="size-4" aria-hidden />
                  {t(`swipe.types.${value}` as never)}
                </span>
              ),
            }
          })}
        />

        <SwipePreview type={type} config={config} />

        <section className={cn(cardSurface, 'divide-y divide-border/60 p-0')}>
          <SideGroup
            icon={<ArrowRight className="size-3.5" aria-hidden />}
            label={t('swipe.leading')}
            side="leading"
            type={type}
            selected={config.leading}
            onToggle={(id) => toggle('leading', id)}
          />
          <SideGroup
            icon={<ArrowLeft className="size-3.5" aria-hidden />}
            label={t('swipe.trailing')}
            side="trailing"
            type={type}
            selected={config.trailing}
            onToggle={(id) => toggle('trailing', id)}
          />
        </section>

        <Button variant="ghost" onClick={resetAll} className="self-start">
          <RotateCcw className="size-[18px]" aria-hidden />
          {t('swipe.reset')}
        </Button>
      </div>
    </AppScreen>
  )
}

function SwipePreview({ type, config }: { type: SwipeItemType; config: SwipeConfig }) {
  const { t } = useTranslation()
  const TypeIcon = TYPE_ICON[type]
  return (
    <div className="flex items-center gap-1" aria-hidden>
      <PreviewCaps ids={config.leading} side="leading" />
      <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-card bg-card px-3 py-2.5 shadow-rest">
        <span className="grid size-8 shrink-0 place-items-center rounded-control bg-info-surface text-primary">
          <TypeIcon className="size-4" />
        </span>
        <span className="min-w-0 flex-1 truncate text-[length:var(--p-text-body)] font-semibold text-heading">
          {t(`swipe.sample.${type}` as never)}
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </div>
      <PreviewCaps ids={config.trailing} side="trailing" />
    </div>
  )
}

function PreviewCaps({ ids, side }: { ids: SwipeActionId[]; side: keyof SwipeConfig }) {
  if (ids.length === 0) return null
  const ordered = side === 'leading' ? ids : [...ids].reverse()
  return (
    <div
      className={cn('flex shrink-0 gap-1', side === 'leading' ? 'flex-row' : 'flex-row-reverse')}
    >
      {ordered.map((id) => {
        const accent = accentOf(id)
        return (
          <span
            key={id}
            style={{ backgroundColor: accent.fill }}
            className={cn(
              'grid size-9 shrink-0 place-items-center rounded-[14px] [&_svg]:size-4',
              accent.ink === 'dark' ? 'text-(--p-navy-900)' : 'text-white',
            )}
          >
            {swipeActionIcon(id)}
          </span>
        )
      })}
    </div>
  )
}

function SideGroup({
  icon,
  label,
  side,
  type,
  selected,
  onToggle,
}: {
  icon: ReactNode
  label: string
  side: keyof SwipeConfig
  type: SwipeItemType
  selected: SwipeActionId[]
  onToggle: (id: SwipeActionId) => void
}) {
  const { t } = useTranslation()
  const max = SWIPE_SIDE_MAX[side]
  const atCap = selected.length >= max

  return (
    <div className="p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[length:var(--p-text-label)] font-bold text-heading">
          <span className="grid size-5 place-items-center rounded-md bg-primary/[0.07] text-primary">
            {icon}
          </span>
          {label}
        </span>
        <span
          className={cn(
            'rounded-pill px-2 py-0.5 text-[length:var(--p-text-tiny)] font-bold tabular-nums',
            atCap
              ? 'bg-info-surface text-info-foreground'
              : 'bg-secondary/50 text-muted-foreground',
          )}
        >
          {t('swipe.sideCount', { count: selected.length, max })}
        </span>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {SWIPE_ACTIONS[type].map((id) => {
          const on = selected.includes(id)
          const accent = accentOf(id)
          const disabled = !on && atCap
          return (
            <button
              key={id}
              type="button"
              aria-pressed={on}
              disabled={disabled}
              onClick={() => onToggle(id)}
              style={on ? ({ '--sw': accent.fill } as CSSProperties) : undefined}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1.5 text-[length:var(--p-text-label)] font-semibold transition-[transform,background-color,color] active:scale-[0.96]',
                'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/30',
                on ? 'sw-tint' : 'bg-secondary/40 text-muted-foreground',
                disabled && 'opacity-40',
              )}
              data-swipe-side={side}
            >
              <span className="grid size-4 place-items-center [&_svg]:size-3.5">
                {swipeActionIcon(id)}
              </span>
              {t(SWIPE_ACTION_META[id].labelKey as never)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
