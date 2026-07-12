import { type ReactNode, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
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
  SWIPE_ACTION_META,
  SWIPE_ACTIONS,
  SWIPE_ITEM_TYPES,
  type SwipeActionId,
  type SwipeConfig,
  type SwipeItemType,
  type SwipeTone,
} from '@/shared/config/swipe'
import { AppScreen, Button, cardSurface, ScreenHeader, swipeActionIcon } from '@/shared/ui'
import { cn } from '@/shared/lib'

const TONE_CHIP: Record<SwipeTone, string> = {
  danger: 'bg-[var(--danger-surface)] text-[var(--danger-on-surface)]',
  success: 'bg-[var(--success-surface)] text-[var(--success-on-surface)]',
  warning: 'bg-info-surface text-info-foreground',
  accent: 'bg-info-surface text-info-foreground',
  neutral: 'bg-secondary/80 text-heading ring-1 ring-inset ring-primary/15',
}

const TYPE_ICON: Record<SwipeItemType, typeof Layers> = {
  deck: Layers,
  folder: Folder,
  card: WalletCards,
}

export interface SettingsSwipePageProps {
  onBack?: () => void
}

export function SettingsSwipePage({ onBack }: SettingsSwipePageProps) {
  const { t } = useTranslation()
  const store = usePreferencesStoreApi()
  const prefs = usePreferencesStore(selectEffectivePreferences)

  useEffect(() => {
    store.getState().start()
  }, [store])

  const save = (type: SwipeItemType, next: SwipeConfig) =>
    void setPreferences(store, {
      swipe: { ...prefs.swipe, [type]: normalizeSwipeConfig(type, next) },
    })

  const toggle = (type: SwipeItemType, side: keyof SwipeConfig, id: SwipeActionId) => {
    const current = prefs.swipe[type]
    const list = current[side]
    const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
    save(type, { ...current, [side]: next })
  }

  const resetAll = () => void setPreferences(store, { swipe: DEFAULT_SWIPE })

  return (
    <AppScreen
      fill
      header={
        <ScreenHeader title={t('swipe.title')} onBack={onBack} backLabel={t('settings.back')} />
      }
    >
      <div className="mt-3 flex flex-col gap-3 pb-24">
        <p className="flex items-start gap-2 px-1 text-[length:var(--p-text-label)] leading-relaxed text-muted-foreground">
          <ArrowLeftRight className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          {t('swipe.subtitle')}
        </p>

        {SWIPE_ITEM_TYPES.map((type) => {
          const TypeIcon = TYPE_ICON[type]
          return (
            <section key={type} className={cn(cardSurface, 'p-3.5')}>
              <h2 className="flex items-center gap-2 text-[length:var(--p-text-sub)] font-bold text-heading">
                <span className="grid size-7 shrink-0 place-items-center rounded-control bg-info-surface text-primary">
                  <TypeIcon className="size-4" aria-hidden />
                </span>
                {t(`swipe.types.${type}` as never)}
              </h2>
              <SideGroup
                icon={<ArrowRight className="size-3.5" aria-hidden />}
                label={t('swipe.leading')}
                type={type}
                side="leading"
                selected={prefs.swipe[type].leading}
                onToggle={(id) => toggle(type, 'leading', id)}
              />
              <SideGroup
                icon={<ArrowLeft className="size-3.5" aria-hidden />}
                label={t('swipe.trailing')}
                type={type}
                side="trailing"
                selected={prefs.swipe[type].trailing}
                onToggle={(id) => toggle(type, 'trailing', id)}
              />
            </section>
          )
        })}

        <Button variant="ghost" onClick={resetAll} className="self-start">
          <RotateCcw className="size-[18px]" aria-hidden />
          {t('swipe.reset')}
        </Button>
      </div>
    </AppScreen>
  )
}

function SideGroup({
  icon,
  label,
  type,
  side,
  selected,
  onToggle,
}: {
  icon: ReactNode
  label: string
  type: SwipeItemType
  side: keyof SwipeConfig
  selected: SwipeActionId[]
  onToggle: (id: SwipeActionId) => void
}) {
  const { t } = useTranslation()
  const atCap = selected.length >= 2

  return (
    <div className="mt-3 border-t border-border/50 pt-3 first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[length:var(--p-text-label)] font-bold text-heading">
          <span className="text-muted-foreground">{icon}</span>
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
          {t('swipe.sideCount', { count: selected.length })}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {SWIPE_ACTIONS[type].map((id) => {
          const on = selected.includes(id)
          const meta = SWIPE_ACTION_META[id]
          const disabled = !on && atCap
          return (
            <button
              key={id}
              type="button"
              aria-pressed={on}
              disabled={disabled}
              onClick={() => onToggle(id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1.5 text-[length:var(--p-text-label)] font-semibold transition-[transform,background-color] active:scale-[0.97]',
                'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/30',
                on ? TONE_CHIP[meta.tone] : 'bg-secondary/40 text-muted-foreground',
                disabled && 'opacity-40',
              )}
              data-swipe-side={side}
            >
              <span className="grid size-4 place-items-center [&_svg]:size-3.5">
                {swipeActionIcon(id)}
              </span>
              {t(meta.labelKey as never)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
