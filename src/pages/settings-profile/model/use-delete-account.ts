import { useCallback, useReducer } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  longDate,
  readOnline,
  useAccountDeletion,
  useResetLocalData,
  useSyncRunner,
} from '@/shared/lib'
import { useAuthActions } from '@/features/session'
import { prepareAccountDeletion, requestAccountDeletion } from '@/features/account'
import { CLOSED, deleteAccountReducer, type DeleteAccountStage } from './delete-account-machine'

export interface DeleteAccount {
  stage: DeleteAccountStage
  /** False with no cloud, or for a guest: there is no account to delete. */
  available: boolean
  open: () => void
  close: () => void
  confirm: () => void
}

/**
 * Deleting the account, as the settings screen sees it: open → Synchronise → type the word →
 * schedule. Nothing is wiped until the cloud holds everything the device does.
 *
 * It used to wipe the local stores and blank the profile, and those writes replicated — blanking
 * the *server* row and tombstoning the content while the account itself survived.
 */
export function useDeleteAccount(onScheduled: () => void): DeleteAccount {
  const { t, i18n } = useTranslation()
  const deletion = useAccountDeletion()
  const runner = useSyncRunner()
  const resetLocalData = useResetLocalData()
  const { signOut } = useAuthActions()
  const [stage, dispatch] = useReducer(deleteAccountReducer, CLOSED)

  const prepare = useCallback(async () => {
    if (!runner) return
    dispatch({ type: 'opened' })
    const readiness = await prepareAccountDeletion({ sync: runner.run, isOnline: readOnline })
    if (readiness.kind === 'needs-review') toast(t('account.delete.needsReview'))
    dispatch({ type: 'prepared', readiness })
  }, [runner, t])

  const confirm = useCallback(async () => {
    if (!deletion || !runner) return
    dispatch({ type: 'submitted' })
    const result = await requestAccountDeletion({
      deletion,
      sync: runner.run,
      isOnline: readOnline,
      resetLocalData,
      signOut,
    })
    if (result.kind === 'needs-review') toast(t('account.delete.needsReview'))
    if (result.kind === 'scheduled') {
      toast.success(
        t('account.delete.scheduled', { date: longDate(result.purgeAfter, i18n.language) }),
      )
      onScheduled()
    }
    dispatch({ type: 'requested', result })
  }, [deletion, runner, resetLocalData, signOut, t, i18n.language, onScheduled])

  return {
    stage,
    available: Boolean(deletion && runner),
    open: () => void prepare(),
    close: () => dispatch({ type: 'closed' }),
    confirm: () => void confirm(),
  }
}
