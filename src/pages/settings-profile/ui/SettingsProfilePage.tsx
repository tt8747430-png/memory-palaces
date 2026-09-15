import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import {
  AppScreen,
  Button,
  Input,
  LabelledField,
  ScreenHeader,
  SettingsRow,
  SettingsSection,
} from '@/shared/ui'
import { BIO_MAX, useProfileForm } from '../model/use-profile-form'
import { useDeleteAccount } from '../model/use-delete-account'
import { AvatarPicker } from './AvatarPicker'
import { DeleteAccountSheet } from './DeleteAccountSheet'
import { PasswordRow } from './PasswordRow'
import { EASE_OUT, useOnline } from '@/shared/lib'

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
  const online = useOnline()
  const deleteAccount = useDeleteAccount(() => void onDeleteAccount())
  const { value, set } = form

  return (
    <AppScreen
      gutter="end"
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
        className="mt-4 flex flex-col gap-6"
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
              className="w-full resize-none rounded-control border border-border bg-card px-3.5 py-2.5 text-entry text-foreground placeholder:text-muted-foreground"
            />
          </LabelledField>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="px-1 text-title font-semibold text-heading">
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
            description={
              online ? t('settings.profileEdit.deleteAccountHint') : t('account.delete.offline')
            }
            // Deleting needs the server to answer now (ADR 0004), so it is gated before the press.
            disabled={!online || !deleteAccount.available}
            onClick={deleteAccount.open}
          />
        </SettingsSection>
      </motion.div>

      <DeleteAccountSheet flow={deleteAccount} />
      {/* A Sync run before deleting may stop to ask about deletions; the question is asked here. */}
    </AppScreen>
  )
}
