import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { selectEffectiveProfile, useProfileStore, useProfileStoreApi } from '@/entities/profile'
import { selectAccountId, useSessionStore } from '@/entities/session'
import { setProfile, setProfilePhoto } from '@/features/profile'
import { fileToSquareImage, isEmail, isInlineImage, selectIsReady, useStorage } from '@/shared/lib'

const MIN_PHONE_DIGITS = 6
export const BIO_MAX = 200

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
  setPhotoFrom: (file: File) => Promise<void>
}

export function useProfileForm(onSaved?: () => void): ProfileFormControl {
  const { t } = useTranslation()
  const store = useProfileStoreApi()
  const storage = useStorage()
  const profile = useProfileStore(selectEffectiveProfile)
  const isReady = useProfileStore(selectIsReady)
  const userId = useSessionStore(selectAccountId)

  const [value, setValue] = useState<ProfileForm>(() => ({
    name: profile.name,
    username: profile.username,
    email: profile.email,
    bio: profile.bio,
    phone: profile.phone,
    avatar: profile.avatar,
  }))
  const [saving, setSaving] = useState(false)

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
      phone: profile.phone,
      avatar: profile.avatar,
    }))
  }, [isReady, profile])

  const set: ProfileFormControl['set'] = (key, next) =>
    setValue((current) => ({
      ...current,
      [key]: key === 'bio' ? String(next).slice(0, BIO_MAX) : next,
    }))

  const emailValid = value.email.trim() === '' || isEmail(value.email.trim())
  const phoneValid =
    value.phone.trim() === '' || value.phone.replace(/\D/g, '').length >= MIN_PHONE_DIGITS

  const save = async () => {
    if (!emailValid || !phoneValid || saving) return
    setSaving(true)
    // A freshly picked photo is still inline; setProfilePhoto saves it, then moves it to storage.
    const pickedPhoto = isInlineImage(value.avatar) ? value.avatar : null
    await setProfile(store, {
      name: value.name.trim(),
      username: value.username.trim(),
      email: value.email.trim(),
      bio: value.bio.trim(),
      phone: value.phone.trim(),
      ...(pickedPhoto ? {} : { avatar: value.avatar }),
    })
    if (pickedPhoto) await setProfilePhoto({ store, storage, userId }, pickedPhoto)
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
        set('avatar', await fileToSquareImage(file))
      } catch {
        toast.error(t('settings.profileEdit.photoError'))
      }
    },
  }
}
