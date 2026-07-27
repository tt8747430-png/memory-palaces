import { type ChangeEvent, useRef } from 'react'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Camera, Trash2 } from 'lucide-react'
import { Avatar, Button } from '@/shared/ui'

const GRADIENT = 'linear-gradient(135deg, var(--primary), var(--accent))'

export interface AvatarPickerProps {
  name: string
  avatar: string | null
  onPick: (file: File) => void
  onRemove: () => void
}

/** The Profile photo, and the two ways to change it. */
export function AvatarPicker({ name, avatar, onPick, onRemove }: AvatarPickerProps) {
  const { t } = useTranslation()
  const fileRef = useRef<HTMLInputElement>(null)
  const choose = () => fileRef.current?.click()

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) onPick(file)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <span
          aria-hidden
          className="absolute inset-0 translate-y-1.5 scale-90 rounded-full opacity-25 blur-xl"
          style={{ background: GRADIENT }}
        />
        <Avatar
          name={name}
          src={avatar}
          className="relative size-24 border-[3px] border-[color:var(--surface)] text-3xl shadow-featured"
        />
        <motion.button
          type="button"
          onClick={choose}
          aria-label={t(
            avatar ? 'settings.profileEdit.changePhoto' : 'settings.profileEdit.uploadPhoto',
          )}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 24 }}
          className="absolute -bottom-1 -right-1 grid size-10 place-items-center rounded-full border-[3px] border-[color:var(--surface)] text-primary-foreground shadow-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          style={{ background: GRADIENT }}
        >
          <Camera className="size-4" aria-hidden />
        </motion.button>
      </div>

      {avatar ? (
        <Button variant="ghost" size="sm" onClick={onRemove}>
          <Trash2 className="size-4" aria-hidden />
          {t('settings.profileEdit.removePhoto')}
        </Button>
      ) : (
        <Button variant="secondary" size="sm" onClick={choose}>
          <Camera className="size-4" aria-hidden />
          {t('settings.profileEdit.uploadPhoto')}
        </Button>
      )}

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onChange} />
    </div>
  )
}
