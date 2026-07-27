import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckSquare, Layers, ListChecks, Plus, RotateCcw, WalletCards } from 'lucide-react'
import {
  selectEffectivePreferences,
  usePreferencesStore,
  usePreferencesStoreApi,
} from '@/entities/preferences'
import { setPreferences } from '@/features/preferences'
import { SWIPE_ACCENT } from '@/shared/config/swipe'
import {
  DEFAULT_SELECT_TOOLBAR,
  normalizeSelectToolbar,
  SELECT_ACTION_META,
  SELECT_ACTIONS,
  SELECT_SURFACES,
  SELECT_TOOLBAR_MAX,
  type SelectActionId,
  type SelectSurface,
  type SelectToolbarConfig,
} from '@/shared/config/select-toolbar'
import { cn } from '@/shared/lib'
import {
  ActionPill,
  AppScreen,
  Button,
  cardSurface,
  ScreenHeader,
  SegmentedControl,
  selectActionIcon,
  SlotCount,
} from '@/shared/ui'
import { ToolbarEditor } from './ToolbarEditor'

const SURFACE_ICON: Record<SelectSurface, typeof Layers> = {
  library: Layers,
  card: WalletCards,
  question: ListChecks,
}

const accentOf = (id: SelectActionId) => SWIPE_ACCENT[SELECT_ACTION_META[id].accent]

export interface SettingsSelectPageProps {
  onBack?: () => void
}

export function SettingsSelectPage({ onBack }: SettingsSelectPageProps) {
  const { t } = useTranslation()
  const store = usePreferencesStoreApi()
  const prefs = usePreferencesStore(selectEffectivePreferences)
  const [surface, setSurface] = useState<SelectSurface>('library')

  useEffect(() => {
    store.getState().start()
  }, [store])

  const config = prefs.selectToolbar[surface]
  const palette = SELECT_ACTIONS[surface].filter((id) => !config.includes(id))
  const full = config.length >= SELECT_TOOLBAR_MAX

  const save = (next: SelectToolbarConfig) =>
    void setPreferences(store, {
      selectToolbar: {
        ...prefs.selectToolbar,
        [surface]: normalizeSelectToolbar(surface, next),
      },
    })

  const add = (id: SelectActionId) => {
    if (full) return
    save([...config, id])
  }
  // The bar always keeps one action — an empty toolbar would strand a selection.
  const remove = (id: SelectActionId) => {
    if (config.length <= 1) return
    save(config.filter((x) => x !== id))
  }
  // The preview above snaps back to the defaults, so the reset speaks for itself.
  const resetAll = () => void setPreferences(store, { selectToolbar: DEFAULT_SELECT_TOOLBAR })

  return (
    <AppScreen
      fill
      header={
        <ScreenHeader title={t('select.title')} onBack={onBack} backLabel={t('settings.back')} />
      }
    >
      <div className="mt-3 flex flex-col gap-4 pb-24">
        <p className="flex items-start gap-2 px-1 text-(length:--p-text-label) leading-relaxed text-muted-foreground">
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

        {/* The preview is the editor: this is the bar as it will appear, and it is where
            actions are reordered and removed. */}
        <ToolbarEditor
          actions={config}
          canRemove={config.length > 1}
          onReorder={save}
          onRemove={remove}
        />

        <section className={cn(cardSurface, 'p-3.5')}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-(length:--p-text-label) font-bold text-heading">
              {t('select.available')}
            </span>
            <SlotCount full={full}>
              {t('select.slots', { count: config.length, max: SELECT_TOOLBAR_MAX })}
            </SlotCount>
          </div>

          {palette.length === 0 ? (
            <p className="mt-2.5 text-(length:--p-text-label) text-muted-foreground">
              {t('select.allInUse')}
            </p>
          ) : (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {palette.map((id) => {
                const label = t(SELECT_ACTION_META[id].labelKey as never)
                return (
                  <ActionPill
                    key={id}
                    label={label}
                    icon={selectActionIcon(id)}
                    accent={accentOf(id).fill}
                    disabled={full}
                    onClick={() => add(id)}
                    aria-label={t('select.addLabel', { name: label })}
                    trailing={<Plus className="size-3.5" aria-hidden />}
                  />
                )
              })}
            </div>
          )}

          {full ? (
            <p className="mt-2.5 text-(length:--p-text-tiny) text-muted-foreground">
              {t('select.full')}
            </p>
          ) : null}
        </section>

        <Button variant="ghost" onClick={resetAll} className="self-start">
          <RotateCcw className="size-[18px]" aria-hidden />
          {t('select.reset')}
        </Button>
      </div>
    </AppScreen>
  )
}
