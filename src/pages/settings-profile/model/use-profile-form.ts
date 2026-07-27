import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  selectEffectiveProfile,
  selectIsReady,
  useProfileStore,
  useProfileStoreApi,
} from '@/entities/profile'
import { setProfile } from '@/features/profile'
import { fileToAvatar } from '@/shared/lib'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PHONE_DIGITS = 6
export const BIO_MAX = 200

/**
 * The phone number is not part of the Profile entity — nothing in the app studies with it — so it
 * is kept beside the Profile rather than migrated into it.
 */
const PHONE_KEY = 'mindscape:phone'

export interface ProfileForm {
  name: string
  username: string
  email: string
  bio: string
  phone: string
  avatar: string | null
}

export interface ProfileFormControl {
  value: ProfileForm
  set: <K extends keyof ProfileForm>(key: K, next: ProfileForm[K]) => void
  emailValid: boolean
  phoneValid: boolean
  canSave: boolean
  saving: boolean
  save: () => Promise<void>
  /** Read an image file into the avatar, or say why it couldn't be read. */
  setPhotoFrom: (file: File) => Promise<void>
}

/**
 * The editable Profile as a form: seeded from the store, corrected as the learner types, checked
 * before it can be saved, and written back in one go. Which fields live in the Profile entity and
 * which live beside it does not reach the caller.
 */
export function useProfileForm(onSaved?: () => void): ProfileFormControl {
  const { t } = useTranslation()
  const store = useProfileStoreApi()
  const profile = useProfileStore(selectEffectiveProfile)
  const isReady = useProfileStore(selectIsReady)

  const [value, setValue] = useState<ProfileForm>(() => ({
    name: profile.name,
    username: profile.username,
    email: profile.email,
    bio: profile.bio,
    phone: localStorage.getItem(PHONE_KEY) ?? '',
    avatar: profile.avatar,
  }))
  const [saving, setSaving] = useState(false)

  // Seed once, on the store's first real emission. Re-seeding on every emission would overwrite
  // what the learner is halfway through typing.
  const seeded = useRef(false)
  useEffect(() => {
    if (!isReady || seeded.current) return
    seeded.current = true
    setValue((current) => ({
      ...current,
      name: profile.name,
      username: profile.username,
      email: profile.email,
      bio: profile.bio,
      avatar: profile.avatar,
    }))
  }, [isReady, profile])

  const set: ProfileFormControl['set'] = (key, next) =>
    setValue((current) => ({
      ...current,
      [key]: key === 'bio' ? String(next).slice(0, BIO_MAX) : next,
    }))

  // Both are optional; an empty field is not an invalid one.
  const emailValid = value.email.trim() === '' || EMAIL_RE.test(value.email.trim())
  const phoneValid =
    value.phone.trim() === '' || value.phone.replace(/\D/g, '').length >= MIN_PHONE_DIGITS

  const save = async () => {
    if (!emailValid || !phoneValid || saving) return
    setSaving(true)
    await setProfile(store, {
      name: value.name.trim(),
      username: value.username.trim(),
      email: value.email.trim(),
      bio: value.bio.trim(),
      avatar: value.avatar,
    })
    const phone = value.phone.trim()
    if (phone) localStorage.setItem(PHONE_KEY, phone)
    else localStorage.removeItem(PHONE_KEY)
    setSaving(false)
    toast.success(t('settings.profileEdit.saved'))
    onSaved?.()
  }

  return {
    value,
    set,
    emailValid,
    phoneValid,
    canSave: emailValid && phoneValid,
    saving,
    save,
    setPhotoFrom: async (file) => {
      try {
        set('avatar', await fileToAvatar(file))
      } catch {
        toast.error(t('settings.profileEdit.photoError'))
      }
    },
  }
}

/** Everything the Profile keeps outside its own record, for a reset to clear too. */
export function forgetPhone() {
  localStorage.removeItem(PHONE_KEY)
}
