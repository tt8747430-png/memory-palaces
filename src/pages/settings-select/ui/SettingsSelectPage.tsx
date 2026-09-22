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
  SELECT_TOOLBAR_MAX,
  type SelectActionId,
  type SelectSurface,
  type SelectToolbarConfig,
} from '@/shared/config/select-toolbar'
import { cn, selectIsReady } from '@/shared/lib'
import {
  ActionSlots,
  AppScreen,
  Button,
  cardSurface,
  DockPill,
  ScreenHeader,
  ScreenLoading,
  SegmentedControl,
  SelectToolbarRow,
  SelectToolbarSlot,
} from '@/shared/ui'

const SURFACE_ICON: Record<SelectSurface, typeof Layers> = {
  library: Layers,
  card: WalletCards,
  question: ListChecks,
}

export interface SettingsSelectPageProps {
  onBack?: () => void
}

/**
 * The actions the toolbar offers while things are selected. One surface at a time, arranged on the
 * same slot strip as the swipe rails — and shown above it as the dock's own pill, so what is
 * arranged here is what appears at the bottom of the screen, tile for tile.
 */
export function SettingsSelectPage({ onBack }: SettingsSelectPageProps) {
  const { t } = useTranslation()
  const store = usePreferencesStoreApi()
  const ready = usePreferencesStore(selectIsReady)
  const prefs = usePreferencesStore(selectEffectivePreferences)
  const [surface, setSurface] = useState<SelectSurface>('library')

  const config = prefs.selectToolbar[surface]
  const spare = SELECT_ACTIONS[surface].filter((id) => !config.includes(id))

  const save = (next: SelectToolbarConfig) =>
    void setPreferences(store, {
      selectToolbar: {
        ...prefs.selectToolbar,
        [surface]: normalizeSelectToolbar(surface, next),
      },
    })

  const resetAll = () => void setPreferences(store, { selectToolbar: DEFAULT_SELECT_TOOLBAR })

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

        {/* The bar itself, at the dock's size — inert, like the swipe preview above its strips. */}
        <div aria-hidden className="mx-auto h-16 w-64">
          <DockPill>
            <SelectToolbarRow>
              {config.map((id) => (
                <SelectToolbarSlot key={id} action={id} inert />
              ))}
            </SelectToolbarRow>
          </DockPill>
        </div>

        <div className={cn(cardSurface, 'p-3.5')}>
          <ActionSlots
            ids={config}
            max={SELECT_TOOLBAR_MAX}
            options={spare}
            label={t('select.inBar')}
            icon={<CheckSquare aria-hidden />}
            min={1}
            onReorder={save}
            onAdd={(id) => save([...config, id as SelectActionId])}
            onRemove={(id) => save(config.filter((each) => each !== id))}
          />
        </div>

        <Button variant="ghost" onClick={resetAll} className="self-start">
          <RotateCcw className="size-4.5" aria-hidden />
          {t('select.reset')}
        </Button>
      </div>
    </AppScreen>
  )
}
