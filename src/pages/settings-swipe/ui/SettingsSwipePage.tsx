import { useEffect, useState } from 'react'
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
  type SwipeActionId,
  type SwipeConfig,
  SWIPE_ITEM_TYPES,
  type SwipeItemType,
} from '@/shared/config/swipe'
import { cn } from '@/shared/lib'
import { AppScreen, Button, cardSurface, ScreenHeader, SegmentedControl } from '@/shared/ui'
import { SideGroup } from './SideGroup'
import { SwipePreview } from './SwipePreview'

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
    if (current[side].includes(id)) {
      save({ ...current, [side]: current[side].filter((x) => x !== id) })
      return
    }
    const other: keyof SwipeConfig = side === 'leading' ? 'trailing' : 'leading'
    save({
      ...current,
      [side]: [...current[side], id],
      [other]: current[other].filter((x) => x !== id),
    })
  }

  const config = prefs.swipe[type]

  return (
    <AppScreen
      fill
      header={
        <ScreenHeader title={t('swipe.title')} onBack={onBack} backLabel={t('settings.back')} />
      }
    >
      <div className="mt-3 flex flex-col gap-4 pb-24">
        <p className="flex items-start gap-2 px-1 text-(length:--p-text-label) leading-relaxed text-muted-foreground">
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

        <SwipePreview type={type} config={config} onChange={save} />

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

        <Button
          variant="ghost"
          onClick={() => void setPreferences(store, { swipe: DEFAULT_SWIPE })}
          className="self-start"
        >
          <RotateCcw className="size-[18px]" aria-hidden />
          {t('swipe.reset')}
        </Button>
      </div>
    </AppScreen>
  )
}
