import { useState } from 'react'
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
  SWIPE_ACTIONS,
  SWIPE_ITEM_TYPES,
  SWIPE_SIDE_MAX,
  type SwipeActionId,
  type SwipeConfig,
  type SwipeItemType,
  withoutSwipeAction,
} from '@/shared/config/swipe'
import { cn, selectIsReady } from '@/shared/lib'
import {
  ActionSlots,
  AppScreen,
  Button,
  cardSurface,
  ScreenHeader,
  ScreenLoading,
  SegmentedControl,
} from '@/shared/ui'
import { SwipePreview } from './SwipePreview'

const TYPE_ICON: Record<SwipeItemType, typeof Layers> = {
  deck: Layers,
  folder: Folder,
  card: WalletCards,
}

type Side = keyof SwipeConfig

const SIDES: readonly Side[] = ['leading', 'trailing']

/** Which way the finger travels to open each rail — the arrow the preview draws from. */
const SIDE_ICON: Record<Side, typeof ArrowRight> = { leading: ArrowRight, trailing: ArrowLeft }

export interface SettingsSwipePageProps {
  onBack?: () => void
}

/**
 * What a swipe on each kind of row does. One kind at a time, and for that kind the two rails
 * themselves: a slot is filled from a picker, dragged into place and taken off by its badge, so
 * every gesture has the thing it acts on under the thumb.
 */
export function SettingsSwipePage({ onBack }: SettingsSwipePageProps) {
  const { t } = useTranslation()
  const store = usePreferencesStoreApi()
  const ready = usePreferencesStore(selectIsReady)
  const prefs = usePreferencesStore(selectEffectivePreferences)
  const [type, setType] = useState<SwipeItemType>('deck')

  const config = prefs.swipe[type]

  const save = (next: SwipeConfig) =>
    void setPreferences(store, {
      swipe: { ...prefs.swipe, [type]: normalizeSwipeConfig(type, next) },
    })

  // Only actions on neither rail are on offer. Moving one across is taking it off and putting it
  // back, which is two deliberate taps rather than a pick that silently empties the other side.
  const spare = SWIPE_ACTIONS[type].filter(
    (id) => !config.leading.includes(id) && !config.trailing.includes(id),
  )

  const add = (side: Side) => (id: SwipeActionId) => {
    const without = withoutSwipeAction(config, id)
    save({ ...without, [side]: [...without[side], id] })
  }
  const remove = (id: SwipeActionId) => save(withoutSwipeAction(config, id))

  if (!ready) return <ScreenLoading />

  return (
    <AppScreen
      gutter="end"
      fill
      header={
        <ScreenHeader title={t('swipe.title')} onBack={onBack} backLabel={t('settings.back')} />
      }
    >
      <div className="mt-3 flex flex-col gap-4">
        <p className="flex items-start gap-2 px-1 text-label leading-relaxed text-muted-foreground">
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

        <div className={cn(cardSurface, 'flex flex-col gap-5 p-3.5')}>
          {SIDES.map((side) => {
            const Icon = SIDE_ICON[side]
            return (
              <ActionSlots
                key={side}
                ids={config[side]}
                max={SWIPE_SIDE_MAX[side]}
                options={spare}
                label={t(`swipe.${side}`)}
                icon={<Icon aria-hidden />}
                onReorder={(ids) => save({ ...config, [side]: ids })}
                onAdd={add(side)}
                onRemove={remove}
              />
            )
          })}
        </div>

        <Button
          variant="ghost"
          onClick={() => void setPreferences(store, { swipe: DEFAULT_SWIPE })}
          className="self-start"
        >
          <RotateCcw className="size-4.5" aria-hidden />
          {t('swipe.reset')}
        </Button>
      </div>
    </AppScreen>
  )
}
