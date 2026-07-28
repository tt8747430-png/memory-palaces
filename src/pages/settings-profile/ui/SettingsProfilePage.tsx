import { useState } from 'react'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import {
  AppScreen,
  Button,
  ConfirmDialog,
  Input,
  ScreenHeader,
  SettingsRow,
  SettingsSection,
} from '@/shared/ui'
import { BIO_MAX, useProfileForm } from '../model/use-profile-form'
import { useDeleteAccount } from '../model/use-delete-account'
import { AvatarPicker } from './AvatarPicker'
import { LabelledField } from './LabelledField'
import { PasswordRow } from './PasswordRow'
import { EASE_OUT } from '@/shared/lib'

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
  const form = useProfileForm(onBack)
  const deleteAccount = useDeleteAccount()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { value, set } = form

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
        transition={{ duration: 0.25, ease: EASE_OUT }}
        className="mt-4 flex flex-col gap-6 pb-gutter"
      >
        <AvatarPicker
          name={value.name}
          avatar={value.avatar}
          onPick={(file) => void form.setPhotoFrom(file)}
          onRemove={() => set('avatar', null)}
        />

        <div className="flex flex-col gap-4">
          <LabelledField label={t('settings.profileEdit.name')}>
            <Input
              value={value.name}
              onChange={(event) => set('name', event.target.value)}
              placeholder={t('settings.profileEdit.namePlaceholder')}
              autoComplete="name"
            />
          </LabelledField>

          <LabelledField label={t('settings.profileEdit.username')}>
            <Input
              value={value.username}
              onChange={(event) => set('username', event.target.value)}
              placeholder={t('settings.profileEdit.usernamePlaceholder')}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
          </LabelledField>

          <LabelledField label={t('settings.profileEdit.bio')}>
            <textarea
              value={value.bio}
              onChange={(event) => set('bio', event.target.value)}
              placeholder={t('settings.profileEdit.bioPlaceholder')}
              maxLength={BIO_MAX}
              rows={3}
              className="w-full resize-none rounded-control border border-border bg-card px-3.5 py-2.5 text-(length:--p-text-body) text-foreground placeholder:text-muted-foreground"
            />
          </LabelledField>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="px-1 text-(length:--p-text-title) font-semibold text-heading">
            {t('settings.accountSection')}
          </h2>

          <LabelledField
            label={t('settings.profileEdit.email')}
            error={form.emailValid ? undefined : t('settings.profileEdit.emailInvalid')}
          >
            <Input
              type="email"
              value={value.email}
              onChange={(event) => set('email', event.target.value)}
              placeholder={t('settings.profileEdit.emailPlaceholder')}
              autoComplete="email"
              aria-invalid={!form.emailValid}
            />
          </LabelledField>

          <LabelledField
            label={t('settings.profileEdit.phone')}
            error={form.phoneValid ? undefined : t('settings.profileEdit.phoneInvalid')}
          >
            <Input
              type="tel"
              inputMode="tel"
              value={value.phone}
              onChange={(event) => set('phone', event.target.value)}
              placeholder={t('settings.profileEdit.phonePlaceholder')}
              autoComplete="tel"
              aria-invalid={!form.phoneValid}
            />
          </LabelledField>

          <PasswordRow onChangePassword={onChangePassword} />
        </div>

        <Button
          size="lg"
          className="w-full"
          disabled={!form.canSave || form.saving}
          onClick={() => void form.save()}
        >
          {form.saving ? (
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

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        destructive
        icon={<Trash2 className="size-6" aria-hidden />}
        title={t('settings.profileEdit.deleteConfirmTitle')}
        description={t('settings.profileEdit.deleteConfirmBody')}
        confirmLabel={t('settings.profileEdit.deleteConfirmCta')}
        cancelLabel={t('common.cancel')}
        onConfirm={() =>
          void deleteAccount().then(() => {
            void onDeleteAccount()
          })
        }
      />
    </AppScreen>
  )
}
