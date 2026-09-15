import { type SyntheticEvent, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ACCOUNT_DELETION_GRACE_DAYS } from '@/shared/config/constants'
import { daysFrom, longDate, useAutoSelect, useOnline } from '@/shared/lib'
import { Button, Input, OfflineNotice, Sheet, Skeleton } from '@/shared/ui'
import type { DeleteAccount } from '../model/use-delete-account'

/**
 * Deleting an account, in the order the spec fixes: gate offline → Synchronise → type the word
 * with the purge date in front of you → schedule.
 *
 * Its own sheet rather than `PromptSheet`, which accepts any non-empty answer: here the word has to
 * match, because the point of typing it is that the press cannot be a reflex.
 */
export function DeleteAccountSheet({ flow }: { flow: DeleteAccount }) {
  const { t, i18n } = useTranslation()
  const online = useOnline()
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { stage } = flow
  const open = stage.kind !== 'closed'
  const autoSelect = useAutoSelect<HTMLInputElement>(stage.kind === 'confirm')

  const word = t('account.delete.confirmWord')
  const matches = value.trim().toLowerCase() === word.toLowerCase()
  const purge = longDate(daysFrom(Date.now(), ACCOUNT_DELETION_GRACE_DAYS), i18n.language)

  useEffect(() => {
    if (!open) setValue('')
  }, [open])

  const submit = (event?: SyntheticEvent) => {
    event?.preventDefault()
    if (stage.kind === 'confirm' && matches && online) flow.confirm()
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) flow.close()
      }}
      title={t('account.delete.title')}
      description={t('account.delete.body', { date: purge })}
      initialFocus={stage.kind === 'confirm' ? inputRef : undefined}
      footer={
        stage.kind === 'problem' ? (
          <Button
            size="lg"
            variant="secondary"
            className="w-full"
            disabled={!online}
            onClick={flow.open}
          >
            {t('account.delete.retry')}
          </Button>
        ) : (
          <Button
            size="lg"
            variant="destructive"
            className="w-full"
            disabled={stage.kind !== 'confirm' || !matches || !online}
            onClick={() => submit()}
          >
            {stage.kind === 'submitting'
              ? t('account.delete.submitting')
              : t('account.delete.confirm')}
          </Button>
        )
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <OfflineNotice message={t('account.delete.offline')} />

        {stage.kind === 'preparing' ? (
          <div role="status" className="flex flex-col gap-2">
            <p className="text-label leading-snug text-muted-foreground">
              {t('account.delete.preparing')}
            </p>
            <Skeleton className="h-12 w-full" />
          </div>
        ) : null}

        {stage.kind === 'problem' && stage.problem !== 'offline' ? (
          <p role="alert" className="text-label leading-snug text-(--danger-on-surface)">
            {stage.problem === 'sync-failed'
              ? t('account.delete.syncFailed')
              : t('account.delete.failed')}
          </p>
        ) : null}

        {stage.kind === 'confirm' || stage.kind === 'submitting' ? (
          <form onSubmit={submit}>
            <label className="flex flex-col gap-1.5">
              <span className="text-label font-medium text-heading">
                {t('account.delete.confirmLabel', { word })}
              </span>
              <Input
                ref={inputRef}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                onFocus={autoSelect}
                disabled={stage.kind === 'submitting'}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="done"
                placeholder={word}
              />
            </label>
          </form>
        ) : null}
      </div>
    </Sheet>
  )
}
