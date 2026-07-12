import { type ChangeEvent, useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Camera, ChevronRight, Lock, Trash2 } from 'lucide-react'
import { fileToAvatar } from '@/shared/lib'
import {
  selectEffectiveProfile,
  selectIsReady,
  useProfileStore,
  useProfileStoreApi,
} from '@/entities/profile'
import { useDeckStoreApi } from '@/entities/deck'
import { useFolderStoreApi } from '@/entities/folder'
import { useCardStoreApi } from '@/entities/card'
import { useQuestionStoreApi } from '@/entities/question'
import { useProgressStoreApi } from '@/entities/progress'
import { useNotificationStoreApi } from '@/entities/notification'
import { setProfile } from '@/features/profile'
import { resetEverything } from '@/features/data'
import {
  AppScreen,
  Avatar,
  Button,
  ConfirmDialog,
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
  onChangePassword: () => void
  onDeleteAccount: () => void | Promise<void>
}

export function SettingsProfilePage({
  onBack,
  onChangePassword,
  onDeleteAccount,
}: SettingsProfilePageProps) {
  const { t } = useTranslation()
  const store = useProfileStoreApi()
  const deckStore = useDeckStoreApi()
  const folderStore = useFolderStoreApi()
  const cardStore = useCardStoreApi()
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
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    store.getState().start()
    deckStore.getState().start()
    folderStore.getState().start()
    cardStore.getState().start()
    questionStore.getState().start()
    progressStore.getState().start()
    notificationStore.getState().start()
  }, [store, deckStore, folderStore, cardStore, questionStore, progressStore, notificationStore])

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
  const phoneValid =
    form.phone.trim() === '' || form.phone.replace(/\D/g, '').length >= MIN_PHONE_DIGITS
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
    if (!canSave || isSaving) return
    setIsSaving(true)
    await setProfile(store, {
      name: form.name.trim(),
      username: form.username.trim(),
      email: form.email.trim(),
      bio: form.bio.trim(),
      avatar: form.avatar,
    })
    if (form.phone.trim()) localStorage.setItem(PHONE_KEY, form.phone.trim())
    else localStorage.removeItem(PHONE_KEY)
    setIsSaving(false)
    toast.success(t('settings.profileEdit.saved'))
    onBack?.()
  }

  const handleDelete = async () => {
    await resetEverything({
      deckStore,
      folderStore,
      cardStore,
      questionStore,
      progressStore,
      notificationStore,
    })
    await setProfile(store, { name: '', username: '', email: '', bio: '', avatar: null })
    localStorage.removeItem(PHONE_KEY)
    await onDeleteAccount()
  }

  return (
    <AppScreen
      header={
        <ScreenHeader
          title={t('settings.profileEdit.title')}
          onBack={onBack}
          backLabel={t('settings.back')}
        />
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="mt-4 flex flex-col gap-6 pb-28"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <span
              aria-hidden
              className="absolute inset-0 translate-y-1.5 scale-90 rounded-full opacity-25 blur-xl"
              style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}
            />
            <Avatar
              name={form.name}
              src={form.avatar}
              className="relative size-24 border-[3px] border-[color:var(--surface)] text-3xl shadow-featured"
            />
            <motion.button
              type="button"
              onClick={() => fileRef.current?.click()}
              aria-label={t(
                form.avatar
                  ? 'settings.profileEdit.changePhoto'
                  : 'settings.profileEdit.uploadPhoto',
              )}
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 24 }}
              className="absolute -bottom-1 -right-1 grid size-10 place-items-center rounded-full border-[3px] border-[color:var(--surface)] text-primary-foreground shadow-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}
            >
              <Camera className="size-4" aria-hidden />
            </motion.button>
          </div>
          {form.avatar ? (
            <Button variant="ghost" size="sm" onClick={() => set('avatar', null)}>
              <Trash2 className="size-4" aria-hidden />
              {t('settings.profileEdit.removePhoto')}
            </Button>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
              <Camera className="size-4" aria-hidden />
              {t('settings.profileEdit.uploadPhoto')}
            </Button>
          )}
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
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="px-1 text-[length:var(--p-text-title)] font-semibold text-heading">
            {t('settings.accountSection')}
          </h2>

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

          <div className="flex flex-col gap-1.5">
            <span className="px-1 text-[length:var(--p-text-label)] font-medium text-muted-foreground">
              {t('settings.profileEdit.password')}
            </span>
            <button
              type="button"
              onClick={onChangePassword}
              aria-label={t('settings.changePassword')}
              className="flex h-11 w-full items-center justify-between rounded-control border border-border bg-card px-3.5 text-left transition-colors active:bg-primary/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <span className="flex items-center gap-2.5 text-foreground">
                <Lock className="size-4 text-muted-foreground" aria-hidden />
                <span aria-hidden className="text-[18px] leading-none tracking-[0.2em]">
                  ••••••••
                </span>
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <span className="text-[length:var(--p-text-label)] font-medium">
                  {t('settings.profileEdit.passwordAction')}
                </span>
                <ChevronRight className="size-4" aria-hidden />
              </span>
            </button>
          </div>
        </div>

        <Button size="lg" className="w-full" disabled={!canSave || isSaving} onClick={handleSave}>
          {isSaving ? (
            <>
              <span
                aria-hidden
                className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
              />
              {t('settings.profileEdit.saving')}
            </>
          ) : (
            t('settings.profileEdit.save')
          )}
        </Button>

        <SettingsSection>
          <SettingsRow
            kind="nav"
            tone="danger"
            icon={<Trash2 />}
            label={t('settings.profileEdit.deleteAccount')}
            description={t('settings.profileEdit.deleteAccountHint')}
            onClick={() => setConfirmDelete(true)}
          />
        </SettingsSection>
      </motion.div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        destructive
        icon={<Trash2 className="size-6" aria-hidden />}
        title={t('settings.profileEdit.deleteConfirmTitle')}
        description={t('settings.profileEdit.deleteConfirmBody')}
        confirmLabel={t('settings.profileEdit.deleteConfirmCta')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => void handleDelete()}
      />
    </AppScreen>
  )
}
