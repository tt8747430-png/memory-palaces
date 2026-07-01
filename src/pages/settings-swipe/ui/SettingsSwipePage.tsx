import { type ReactNode, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  Folder,
  Layers,
  DoorOpen,
  Landmark,
  RotateCcw,
  Zap,
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

export interface SettingsSwipePageProps {
  onBack?: () => void
}

/** Selected-chip surfaces — the same solid, saturated registers the swipe trays use, so the
 * chip a user picks looks exactly like the action they'll feel. */
const TONE_CHIP: Record<SwipeTone, string> = {
  danger: 'bg-[var(--danger)] text-white',
  warning: 'bg-[var(--warning)] text-[var(--p-navy-900)]',
  success: 'bg-[var(--success)] text-white',
  accent: 'bg-[var(--accent)] text-white',
  neutral: 'bg-[var(--p-gray-500)] text-white',
}

/** One glyph per row type, so each section reads at a glance instead of by heading alone. */
const TYPE_ICON: Record<SwipeItemType, typeof Landmark> = {
  palace: Landmark,
  folder: Folder,
  room: DoorOpen,
  card: Layers,
}

/**
 * Swipe actions — re-map what a left or right swipe does on each kind of list row. Each side
 * holds up to two actions; the edge-most one is what a full swipe auto-fires. Persisted onto
 * `preferences.swipe`, normalized so a side can never exceed two or hold a retired action.
 */
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

  // Toggle an action on a side: remove it if already there, else append (the array's order
  // is the tray's left→right order, so a newly added action lands at the edge). The cap to two
  // happens on save via `normalizeSwipeConfig`.
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
      <div className="mt-4 flex flex-col gap-5 pb-28">
        <div className="rounded-card bg-info-surface p-4">
          <p className="flex items-center gap-2 text-[length:var(--p-text-title)] font-bold tracking-tight text-info-foreground">
            <span className="grid size-8 shrink-0 place-items-center rounded-control bg-card/70 text-primary">
              <ArrowLeftRight className="size-4" aria-hidden />
            </span>
            {t('swipe.title')}
          </p>
          <p className="mt-2 text-[length:var(--p-text-label)] leading-relaxed text-info-foreground/80">
            {t('swipe.subtitle')}
          </p>
        </div>

        {SWIPE_ITEM_TYPES.map((type) => {
          const TypeIcon = TYPE_ICON[type]
          return (
            <section key={type} className={cn(cardSurface, 'p-4')}>
              <h2 className="flex items-center gap-2.5 text-[length:var(--p-text-title)] font-bold tracking-tight text-heading">
                <span className="grid size-8 shrink-0 place-items-center rounded-control bg-info-surface text-primary">
                  <TypeIcon className="size-[18px]" aria-hidden />
                </span>
                {t(`swipe.types.${type}` as never)}
              </h2>
              <SideGroup
                icon={<ArrowRight className="size-4" aria-hidden />}
                label={t('swipe.leading')}
                hint={t('swipe.leadingHint')}
                type={type}
                side="leading"
                selected={prefs.swipe[type].leading}
                onToggle={(id) => toggle(type, 'leading', id)}
              />
              <SideGroup
                icon={<ArrowLeft className="size-4" aria-hidden />}
                label={t('swipe.trailing')}
                hint={t('swipe.trailingHint')}
                type={type}
                side="trailing"
                selected={prefs.swipe[type].trailing}
                onToggle={(id) => toggle(type, 'trailing', id)}
              />
            </section>
          )
        })}

        <p className="flex items-start gap-2 px-1 text-[length:var(--p-text-label)] leading-snug text-muted-foreground">
          <Zap className="mt-0.5 size-4 shrink-0 text-[var(--warning-foreground)]" aria-hidden />
          {t('swipe.fullSwipeNote')}
        </p>

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
  hint,
  type,
  side,
  selected,
  onToggle,
}: {
  icon: ReactNode
  label: string
  hint: string
  type: SwipeItemType
  side: keyof SwipeConfig
  selected: SwipeActionId[]
  onToggle: (id: SwipeActionId) => void
}) {
  const { t } = useTranslation()
  const atCap = selected.length >= 2
  // The action a full swipe auto-fires: index 0 on the leading tray, the last on the trailing.
  const autoFireId =
    selected.length === 0 ? null : side === 'leading' ? selected[0] : selected[selected.length - 1]

  return (
    <div className="mt-4 border-t border-border/60 pt-4 first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[length:var(--p-text-sub)] font-bold text-heading">
          <span className="text-muted-foreground">{icon}</span>
          {label}
        </span>
        <span
          className={cn(
            'rounded-pill px-2 py-0.5 text-[length:var(--p-text-tiny)] font-bold tabular-nums',
            atCap ? 'bg-info-surface text-info-foreground' : 'bg-secondary/40 text-heading',
          )}
        >
          {t('swipe.sideCount', { count: selected.length })}
        </span>
      </div>
      <p className="mt-0.5 text-[length:var(--p-text-tiny)] text-muted-foreground">
        {atCap ? t('swipe.capHint') : hint}
      </p>

      <div className="mt-2.5 flex flex-wrap gap-2">
        {SWIPE_ACTIONS[type].map((id) => {
          const on = selected.includes(id)
          const meta = SWIPE_ACTION_META[id]
          const isAutoFire = on && id === autoFireId
          // An off chip when both slots are full is disabled — you swap by clearing one first.
          const disabled = !on && atCap
          return (
            <button
              key={id}
              type="button"
              aria-pressed={on}
              disabled={disabled}
              onClick={() => onToggle(id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-pill px-3 py-2 text-[length:var(--p-text-label)] font-bold transition-[transform,background-color,box-shadow] active:scale-[0.97]',
                'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40',
                on ? TONE_CHIP[meta.tone] : 'bg-secondary/50 text-heading',
                isAutoFire && 'shadow-interactive',
                disabled && 'opacity-40',
              )}
              data-swipe-side={side}
            >
              <span className="grid size-4 place-items-center [&_svg]:size-4">
                {swipeActionIcon(id)}
              </span>
              {t(meta.labelKey as never)}
              {isAutoFire ? (
                <Zap
                  className="size-3 fill-current"
                  aria-label={t('swipe.autoFire')}
                />
              ) : null}
            </button>
          )
        })}
      </div>

      {autoFireId ? (
        <p className="mt-2 inline-flex items-center gap-1.5 text-[length:var(--p-text-tiny)] font-semibold text-muted-foreground">
          <Zap className="size-3 shrink-0 text-[var(--warning-foreground)]" aria-hidden />
          {t('swipe.fullFires', { action: t(SWIPE_ACTION_META[autoFireId].labelKey as never) })}
        </p>
      ) : (
        <p className="mt-2 text-[length:var(--p-text-tiny)] italic text-faint">
          {t('swipe.emptySide')}
        </p>
      )}
    </div>
  )
}
