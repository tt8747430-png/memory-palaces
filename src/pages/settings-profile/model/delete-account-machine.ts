import type { DeletionReadiness, DeletionRequest } from '@/features/account'

/**
 * Where the delete-account sheet is. One value, not a flag each: `preparing` over `confirm` or a
 * problem over `submitting` are not states the sheet can be in, and separate booleans made them
 * reachable.
 */
export type DeleteAccountStage =
  | { kind: 'closed' }
  | { kind: 'preparing' }
  | { kind: 'confirm' }
  | { kind: 'submitting' }
  | { kind: 'problem'; problem: 'offline' | 'sync-failed' | 'failed' }

export type DeleteAccountEvent =
  | { type: 'opened' }
  | { type: 'prepared'; readiness: DeletionReadiness }
  | { type: 'submitted' }
  | { type: 'requested'; result: DeletionRequest }
  | { type: 'closed' }

export const CLOSED: DeleteAccountStage = { kind: 'closed' }

/** Where a readiness check or a request leaves the sheet — the one place their kinds are read. */
function afterCheck(result: DeletionReadiness | DeletionRequest): DeleteAccountStage {
  switch (result.kind) {
    case 'ready':
      return { kind: 'confirm' }
    // The Sync stopped to ask about deletions: the review dialog opens, and this sheet gets out of
    // its way. Deleting the account can be asked again once that is answered.
    case 'needs-review':
    case 'scheduled':
      return CLOSED
    case 'offline':
      return { kind: 'problem', problem: 'offline' }
    case 'sync-failed':
      return { kind: 'problem', problem: 'sync-failed' }
    case 'failed':
      return { kind: 'problem', problem: 'failed' }
  }
}

export function deleteAccountReducer(
  stage: DeleteAccountStage,
  event: DeleteAccountEvent,
): DeleteAccountStage {
  switch (event.type) {
    case 'opened':
      return { kind: 'preparing' }
    case 'prepared':
      return stage.kind === 'preparing' ? afterCheck(event.readiness) : stage
    case 'submitted':
      return stage.kind === 'confirm' ? { kind: 'submitting' } : stage
    case 'requested':
      return stage.kind === 'submitting' ? afterCheck(event.result) : stage
    // A sheet mid-request stays open: closing it would not stop the request, only hide its answer.
    case 'closed':
      return stage.kind === 'submitting' ? stage : CLOSED
  }
}
