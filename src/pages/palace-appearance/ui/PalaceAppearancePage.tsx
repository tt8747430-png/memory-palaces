import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ImagePlus, Tag } from 'lucide-react'
import { ColorPicker, IconPicker, editPalace } from '@/features/palace'
import {
  selectIsReady as selectPalacesReady,
  usePalaceStore,
  usePalaceStoreApi,
  type Palace,
} from '@/entities/palace'
import { fileToAvatar } from '@/shared/lib'
import {
  AppScreen,
  Button,
  PalaceCover,
  ScreenHeader,
  SettingsSection,
  TextField,
} from '@/shared/ui'

export interface PalaceAppearancePageProps {
  palaceId: string
  onBack?: () => void
}

/** Appearance & category for a single palace — cover photo, icon, colour, and category.
 * Split out of the main palace-settings page so that page stays a short, scannable list;
 * every change persists immediately through the palace command layer. */
export function PalaceAppearancePage({ palaceId, onBack }: PalaceAppearancePageProps) {
  const { t } = useTranslation()
  const palaceStore = usePalaceStoreApi()

  useEffect(() => {
    palaceStore.getState().start()
  }, [palaceStore])

  const palace = usePalaceStore((state) =>
    state.palaces.find((candidate) => candidate.id === palaceId),
  )
  const ready = usePalaceStore(selectPalacesReady)

  if (!ready) {
    return (
      <AppScreen className="items-center justify-center">
        <span className="size-8 animate-pulse rounded-full bg-secondary" aria-hidden />
      </AppScreen>
    )
  }

  if (!palace) {
    return (
      <AppScreen
        header={
          <ScreenHeader
            title={t('palaceSettings.notFound')}
            onBack={onBack}
            backLabel={t('palaceSettings.appearanceBack')}
          />
        }
      />
    )
  }

  return (
    <AppScreen
      fill
      header={
        <ScreenHeader
          title={t('palaceSettings.appearanceCategory')}
          subtitle={palace.name}
          onBack={onBack}
          backLabel={t('palaceSettings.appearanceBack')}
        />
      }
    >
      <PalaceAppearanceForm palace={palace} />
    </AppScreen>
  )
}

function PalaceAppearanceForm({ palace }: { palace: Palace }) {
  const { t } = useTranslation()
  const palaceStore = usePalaceStoreApi()
  const fileRef = useRef<HTMLInputElement>(null)
  const [category, setCategory] = useState(palace.category)

  useEffect(() => {
    setCategory(palace.category)
  }, [palace.id, palace.category])

  const patch = (changes: Parameters<typeof editPalace>[2]) =>
    void editPalace(palaceStore, palace.id, changes)

  const handlePhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) patch({ image: await fileToAvatar(file) })
    event.target.value = ''
  }

  return (
    <div className="mt-4 flex flex-col gap-6 pb-28">
      {/* Appearance */}
      <SettingsSection title={t('palaceSettings.appearance')}>
        <div className="space-y-4 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[length:var(--p-text-sub)] font-semibold text-heading">
                {t('palaceSettings.coverPhoto')}
              </p>
              <p className="text-[length:var(--p-text-label)] text-muted-foreground">
                {t('palaceSettings.coverPhotoHint')}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {palace.image ? (
                <Button size="sm" variant="ghost" onClick={() => patch({ image: undefined })}>
                  {t('palaceSettings.removePhoto')}
                </Button>
              ) : null}
              <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
                <ImagePlus className="size-[18px]" aria-hidden />
                {palace.image ? t('palaceSettings.replacePhoto') : t('palaceSettings.addPhoto')}
              </Button>
            </div>
          </div>
          {palace.image ? (
            <PalaceCover
              icon={palace.icon}
              color={palace.color}
              image={palace.image}
              className="h-32 w-full rounded-card shadow-rest"
              iconClassName="text-4xl"
            />
          ) : null}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          <IconPicker
            value={palace.icon}
            onChange={(icon) => patch({ icon })}
            label={t('palaceSettings.iconLabel')}
          />
          <ColorPicker
            value={palace.color}
            onChange={(color) => patch({ color })}
            label={t('palaceSettings.colorLabel')}
            customLabel={t('palaceSettings.customColor')}
          />
        </div>
      </SettingsSection>

      {/* Category */}
      <SettingsSection title={t('palaceSettings.type')}>
        <label className="flex items-center gap-3 p-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-control bg-info-surface text-info-foreground">
            <Tag className="size-[18px]" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[length:var(--p-text-sub)] font-semibold text-heading">
              {t('palaceSettings.category')}
            </span>
            <TextField
              className="mt-1.5"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              onBlur={() => category.trim() !== palace.category && patch({ category: category.trim() })}
              placeholder={t('palaceSettings.categoryPlaceholder')}
              maxLength={40}
            />
          </span>
        </label>
      </SettingsSection>
    </div>
  )
}
