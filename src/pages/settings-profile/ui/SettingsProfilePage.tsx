import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Camera, Trash2 } from 'lucide-react'
import { fileToAvatar } from '@/shared/lib'
import {
  selectEffectiveProfile,
  selectIsReady,
  useProfileStore,
  useProfileStoreApi,
} from '@/entities/profile'
import { setProfile } from '@/features/profile'
import { AppScreen, Avatar, Button, ScreenHeader, TextField } from '@/shared/ui'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const BIO_MAX = 200

interface Form {
  name: string
  email: string
  bio: string
  avatar: string | null
}

export interface SettingsProfilePageProps {
  onBack?: () => void
}

/** Edit Profile — name, email, bio, and avatar, written through the setProfile command.
 * The form hydrates once from the store, then owns its own state until saved. */
export function SettingsProfilePage({ onBack }: SettingsProfilePageProps) {
  const { t } = useTranslation()
  const store = useProfileStoreApi()
  const profile = useProfileStore(selectEffectiveProfile)
  const isReady = useProfileStore(selectIsReady)
  const fileRef = useRef<HTMLInputElement>(null)
  const hydrated = useRef(false)
  const [form, setForm] = useState<Form>(() => ({
    name: profile.name,
    email: profile.email,
    bio: profile.bio,
    avatar: profile.avatar,
  }))

  useEffect(() => {
    store.getState().start()
  }, [store])

  useEffect(() => {
    if (isReady && !hydrated.current) {
      hydrated.current = true
      setForm({ name: profile.name, email: profile.email, bio: profile.bio, avatar: profile.avatar })
    }
  }, [isReady, profile])

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((current) => ({ ...current, [key]: value }))
  const emailValid = form.email.trim() === '' || EMAIL_RE.test(form.email.trim())

  const handlePhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      set('avatar', await fileToAvatar(file))
    } catch {
      toast.error(t('settings.profileEdit.photoError'))
    }
  }

  const handleSave = async () => {
    if (!emailValid) return
    await setProfile(store, {
      name: form.name.trim(),
      email: form.email.trim(),
      bio: form.bio.trim(),
      avatar: form.avatar,
    })
    toast.success(t('settings.profileEdit.saved'))
    onBack?.()
  }

  return (
    <AppScreen className="pt-safe">
      <ScreenHeader
        title={t('settings.profileEdit.title')}
        onBack={onBack}
        backLabel={t('settings.back')}
      />

      <div className="mt-4 flex flex-col gap-6 pb-28">
        <div className="flex flex-col items-center gap-3">
          <Avatar name={form.name} src={form.avatar} className="size-24 text-3xl shadow-rest" />
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
              <Camera className="size-4" aria-hidden />
              {t('settings.profileEdit.changePhoto')}
            </Button>
            {form.avatar ? (
              <Button variant="ghost" size="sm" onClick={() => set('avatar', null)}>
                <Trash2 className="size-4" aria-hidden />
                {t('settings.profileEdit.removePhoto')}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="px-1 text-[length:var(--p-text-label)] font-medium text-muted-foreground">
              {t('settings.profileEdit.name')}
            </span>
            <TextField
              value={form.name}
              onChange={(event) => set('name', event.target.value)}
              placeholder={t('settings.profileEdit.namePlaceholder')}
              autoComplete="name"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="px-1 text-[length:var(--p-text-label)] font-medium text-muted-foreground">
              {t('settings.profileEdit.email')}
            </span>
            <TextField
              type="email"
              value={form.email}
              onChange={(event) => set('email', event.target.value)}
              placeholder={t('settings.profileEdit.emailPlaceholder')}
              autoComplete="email"
              aria-invalid={!emailValid}
            />
            {!emailValid ? (
              <span className="px-1 text-[length:var(--p-text-label)] text-[var(--danger-on-surface)]">
                {t('settings.profileEdit.emailInvalid')}
              </span>
            ) : null}
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="px-1 text-[length:var(--p-text-label)] font-medium text-muted-foreground">
              {t('settings.profileEdit.bio')}
            </span>
            <textarea
              value={form.bio}
              onChange={(event) => set('bio', event.target.value.slice(0, BIO_MAX))}
              placeholder={t('settings.profileEdit.bioPlaceholder')}
              rows={3}
              className="w-full resize-none rounded-control border border-border bg-card px-3.5 py-2.5 text-[length:var(--p-text-body)] text-foreground placeholder:text-muted-foreground"
            />
          </label>
        </div>

        <Button size="lg" className="w-full" disabled={!emailValid} onClick={handleSave}>
          {t('settings.profileEdit.save')}
        </Button>
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
    </AppScreen>
  )
}
