import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Camera, KeyRound, LogOut, Trash2 } from 'lucide-react'
import { fileToAvatar } from '@/shared/lib'
import {
  selectEffectiveProfile,
  selectIsReady,
  useProfileStore,
  useProfileStoreApi,
} from '@/entities/profile'
import { usePalaceStoreApi } from '@/entities/palace'
import { useRoomStoreApi } from '@/entities/room'
import { useLocusStoreApi } from '@/entities/locus'
import { useQuestionStoreApi } from '@/entities/question'
import { useProgressStoreApi } from '@/entities/progress'
import { useNotificationStoreApi } from '@/entities/notification'
import { setProfile } from '@/features/profile'
import { resetEverything } from '@/features/data'
import {
  ActionSheet,
  AppScreen,
  Avatar,
  Button,
  ScreenHeader,
  SettingsRow,
  SettingsSection,
  TextField,
} from '@/shared/ui'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const BIO_MAX = 200
const PHONE_KEY = 'mindscape:phone'
const MIN_PHONE_DIGITS = 6

interface Form {
  name: string
  username: string
  email: string
  bio: string
  phone: string
  avatar: string | null
}

export interface SettingsProfilePageProps {
  onBack?: () => void
  /** Navigate to the change-password screen. */
  onChangePassword: () => void
  /** Sign out and return to login (the route owns the auth + navigation). */
  onLogout: () => void | Promise<void>
  /** Sign out and return to login, called after this screen has wiped local data. */
  onDeleteAccount: () => void | Promise<void>
}

/**
 * The consolidated Profile screen: edit identity (avatar, name, username, bio, email,
 * phone), jump to change-password, and the account exits — log out, and the
 * irreversible delete that wipes every local trace before signing out. Both exits go
 * through a confirmation sheet; delete additionally clears all content, progress, and
 * the saved profile on this device.
 */
export function SettingsProfilePage({
  onBack,
  onChangePassword,
  onLogout,
  onDeleteAccount,
}: SettingsProfilePageProps) {
  const { t } = useTranslation()
  const store = useProfileStoreApi()
  const palaceStore = usePalaceStoreApi()
  const roomStore = useRoomStoreApi()
  const locusStore = useLocusStoreApi()
  const questionStore = useQuestionStoreApi()
  const progressStore = useProgressStoreApi()
  const notificationStore = useNotificationStoreApi()
  const profile = useProfileStore(selectEffectiveProfile)
  const isReady = useProfileStore(selectIsReady)
  const fileRef = useRef<HTMLInputElement>(null)
  const hydrated = useRef(false)
  const [form, setForm] = useState<Form>(() => ({
    name: profile.name,
    username: profile.username,
    email: profile.email,
    bio: profile.bio,
    phone: localStorage.getItem(PHONE_KEY) ?? '',
    avatar: profile.avatar,
  }))
  const [confirm, setConfirm] = useState<'logout' | 'delete' | null>(null)

  // Start the data stores so the delete-account wipe sees the on-device records.
  useEffect(() => {
    store.getState().start()
    palaceStore.getState().start()
    roomStore.getState().start()
    locusStore.getState().start()
    questionStore.getState().start()
    progressStore.getState().start()
    notificationStore.getState().start()
  }, [store, palaceStore, roomStore, locusStore, questionStore, progressStore, notificationStore])

  useEffect(() => {
    if (isReady && !hydrated.current) {
      hydrated.current = true
      setForm((current) => ({
        ...current,
        name: profile.name,
        username: profile.username,
        email: profile.email,
        bio: profile.bio,
        avatar: profile.avatar,
      }))
    }
  }, [isReady, profile])

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  const emailValid = form.email.trim() === '' || EMAIL_RE.test(form.email.trim())
  const phoneValid = form.phone.trim() === '' || form.phone.replace(/\D/g, '').length >= MIN_PHONE_DIGITS
  const canSave = emailValid && phoneValid

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
    if (!canSave) return
    await setProfile(store, {
      name: form.name.trim(),
      username: form.username.trim(),
      email: form.email.trim(),
      bio: form.bio.trim(),
      avatar: form.avatar,
    })
    if (form.phone.trim()) localStorage.setItem(PHONE_KEY, form.phone.trim())
    else localStorage.removeItem(PHONE_KEY)
    toast.success(t('settings.profileEdit.saved'))
    onBack?.()
  }

  const handleDelete = async () => {
    await resetEverything({
      palaceStore,
      roomStore,
      locusStore,
      questionStore,
      progressStore,
      notificationStore,
    })
    await setProfile(store, { name: '', username: '', email: '', bio: '', avatar: null })
    localStorage.removeItem(PHONE_KEY)
    await onDeleteAccount()
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
              {t('settings.profileEdit.username')}
            </span>
            <TextField
              value={form.username}
              onChange={(event) => set('username', event.target.value)}
              placeholder={t('settings.profileEdit.usernamePlaceholder')}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
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
              {t('settings.profileEdit.phone')}
            </span>
            <TextField
              type="tel"
              inputMode="tel"
              value={form.phone}
              onChange={(event) => set('phone', event.target.value)}
              placeholder={t('settings.profileEdit.phonePlaceholder')}
              autoComplete="tel"
              aria-invalid={!phoneValid}
            />
            {!phoneValid ? (
              <span className="px-1 text-[length:var(--p-text-label)] text-[var(--danger-on-surface)]">
                {t('settings.profileEdit.phoneInvalid')}
              </span>
            ) : null}
          </label>
        </div>

        <Button size="lg" className="w-full" disabled={!canSave} onClick={handleSave}>
          {t('settings.profileEdit.save')}
        </Button>

        <SettingsSection title={t('settings.profileEdit.securitySection')}>
          <SettingsRow
            kind="nav"
            icon={<KeyRound />}
            label={t('settings.changePassword')}
            onClick={onChangePassword}
          />
        </SettingsSection>

        <SettingsSection>
          <SettingsRow
            kind="nav"
            icon={<LogOut />}
            label={t('settings.profileEdit.logout')}
            onClick={() => setConfirm('logout')}
          />
          <SettingsRow
            kind="nav"
            tone="danger"
            icon={<Trash2 />}
            label={t('settings.profileEdit.deleteAccount')}
            description={t('settings.profileEdit.deleteAccountHint')}
            onClick={() => setConfirm('delete')}
          />
        </SettingsSection>
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />

      <ActionSheet
        open={confirm === 'logout'}
        onOpenChange={(open) => (open ? setConfirm('logout') : setConfirm(null))}
        title={t('settings.profileEdit.logoutConfirmTitle')}
        description={t('settings.profileEdit.logoutConfirmBody')}
        actions={[
          {
            id: 'logout',
            label: t('settings.profileEdit.logoutConfirmCta'),
            icon: <LogOut className="size-[18px]" aria-hidden />,
            onSelect: () => void onLogout(),
          },
        ]}
        cancelLabel={t('common.cancel')}
      />

      <ActionSheet
        open={confirm === 'delete'}
        onOpenChange={(open) => (open ? setConfirm('delete') : setConfirm(null))}
        title={t('settings.profileEdit.deleteConfirmTitle')}
        description={t('settings.profileEdit.deleteConfirmBody')}
        actions={[
          {
            id: 'delete',
            label: t('settings.profileEdit.deleteConfirmCta'),
            destructive: true,
            icon: <Trash2 className="size-[18px]" aria-hidden />,
            onSelect: () => void handleDelete(),
          },
        ]}
        cancelLabel={t('common.cancel')}
      />
    </AppScreen>
  )
}
