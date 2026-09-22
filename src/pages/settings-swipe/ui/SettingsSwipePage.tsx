import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeftRight, RotateCcw } from 'lucide-react'
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
  railWithRoom,
  SWIPE_ITEM_TYPES,
  type SwipeConfig,
  type SwipeItemType,
  withoutSwipeAction,
  withSwipeAction,
} from '@/shared/config/swipe'
import { cn, selectIsReady } from '@/shared/lib'
import {
  AppScreen,
  Button,
  cardSurface,
  ScreenHeader,
  ScreenLoading,
  SegmentedControl,
} from '@/shared/ui'
import { ActionsPalette, SWIPE_TYPE_ICON, SwipeRailsBar } from '@/widgets/action-slots'

/** What the line under the palette says: how to arrange what is on, or why nothing more goes on. */
function railsHintKey(placed: number, hasRoom: boolean) {
  if (placed === 0) return 'swipe.railsEmpty'
  return hasRoom ? 'swipe.railsHint' : 'swipe.railsFull'
}

export interface SettingsSwipePageProps {
  onBack?: () => void
}

/**
 * What a swipe on each kind of row does. One kind at a time, on two surfaces that answer different
 * questions: the row above says *where* — both swipes open, every cap draggable across it, its badge
 * taking it off — and the palette below says *which*, every action this kind has, on or off with one
 * tap. An action switched on joins the end of the right-hand swipe; from there it drags anywhere.
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

  const placed = [...config.leading, ...config.trailing]
  const hasRoom = railWithRoom(config) !== null

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
            const Icon = SWIPE_TYPE_ICON[value]
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

        <SwipeRailsBar type={type} config={config} onChange={save} />

        <div className={cn(cardSurface, 'p-3.5')}>
          <ActionsPalette
            label={t('swipe.rails')}
            actions={SWIPE_ACTIONS[type]}
            placed={placed}
            hasRoom={hasRoom}
            onAdd={(id) => save(withSwipeAction(config, id))}
            onRemove={(id) => save(withoutSwipeAction(config, id))}
            hint={t(railsHintKey(placed.length, hasRoom))}
          />
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
