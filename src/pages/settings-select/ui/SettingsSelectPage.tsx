import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckSquare, Layers, ListChecks, RotateCcw, WalletCards } from 'lucide-react'
import {
  selectEffectivePreferences,
  usePreferencesStore,
  usePreferencesStoreApi,
} from '@/entities/preferences'
import { setPreferences } from '@/features/preferences'
import {
  DEFAULT_SELECT_TOOLBAR,
  normalizeSelectToolbar,
  SELECT_ACTIONS,
  SELECT_SURFACES,
  type SelectActionId,
  type SelectSurface,
  type SelectToolbarConfig,
  selectToolbarCanShrink,
  selectToolbarHasRoom,
} from '@/shared/config/select-toolbar'
import { cn, selectIsReady } from '@/shared/lib'
import {
  AppScreen,
  Button,
  cardSurface,
  ScreenHeader,
  ScreenLoading,
  SegmentedControl,
} from '@/shared/ui'
import { ActionsPalette, SelectToolbarBar } from '@/widgets/action-slots'

const SURFACE_ICON: Record<SelectSurface, typeof Layers> = {
  library: Layers,
  card: WalletCards,
  question: ListChecks,
}

export interface SettingsSelectPageProps {
  onBack?: () => void
}

/**
 * The actions the toolbar offers while things are selected. One surface at a time, on two surfaces
 * that answer different questions: the dock's own pill above says *where* — the real bar, its slots
 * draggable, each badge taking one off — and the palette below says *which*, every action this surface has, on or off with one
 * tap. What is arranged here is what appears at the bottom of the screen, tile for tile.
 */
export function SettingsSelectPage({ onBack }: SettingsSelectPageProps) {
  const { t } = useTranslation()
  const store = usePreferencesStoreApi()
  const ready = usePreferencesStore(selectIsReady)
  const prefs = usePreferencesStore(selectEffectivePreferences)
  const [surface, setSurface] = useState<SelectSurface>('library')

  const config = prefs.selectToolbar[surface]
  const hasRoom = selectToolbarHasRoom(config)

  const save = (next: SelectToolbarConfig) =>
    void setPreferences(store, {
      selectToolbar: {
        ...prefs.selectToolbar,
        [surface]: normalizeSelectToolbar(surface, next),
      },
    })

  if (!ready) return <ScreenLoading />

  return (
    <AppScreen
      gutter="end"
      fill
      header={
        <ScreenHeader title={t('select.title')} onBack={onBack} backLabel={t('settings.back')} />
      }
    >
      <div className="mt-3 flex flex-col gap-4">
        <p className="flex items-start gap-2 px-1 text-label leading-relaxed text-muted-foreground">
          <CheckSquare className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          {t('select.subtitle')}
        </p>

        <SegmentedControl
          aria-label={t('select.title')}
          value={surface}
          onChange={setSurface}
          size="sm"
          options={SELECT_SURFACES.map((value) => {
            const Icon = SURFACE_ICON[value]
            return {
              value,
              ariaLabel: t(`select.surfaces.${value}` as never),
              label: (
                <span className="flex items-center gap-1.5">
                  <Icon className="size-4" aria-hidden />
                  {t(`select.surfaces.${value}` as never)}
                </span>
              ),
            }
          })}
        />

        <SelectToolbarBar config={config} onChange={save} />

        <div className={cn(cardSurface, 'p-3.5')}>
          <ActionsPalette
            label={t('select.inBar')}
            actions={SELECT_ACTIONS[surface]}
            placed={config}
            hasRoom={hasRoom}
            canRemove={selectToolbarCanShrink(config)}
            onAdd={(id: SelectActionId) => save([...config, id])}
            onRemove={(id) => save(config.filter((each) => each !== id))}
            hint={hasRoom ? t('select.barHint') : t('select.barFull')}
          />
        </div>

        <Button
          variant="ghost"
          onClick={() => void setPreferences(store, { selectToolbar: DEFAULT_SELECT_TOOLBAR })}
          className="self-start"
        >
          <RotateCcw className="size-4.5" aria-hidden />
          {t('select.reset')}
        </Button>
      </div>
    </AppScreen>
  )
}
