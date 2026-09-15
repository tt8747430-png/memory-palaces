import type { DeletionReadiness, DeletionRequest } from '@/features/account'

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

function afterCheck(result: DeletionReadiness | DeletionRequest): DeleteAccountStage {
  switch (result.kind) {
    case 'ready':
      return { kind: 'confirm' }
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
    case 'closed':
      return stage.kind === 'submitting' ? stage : CLOSED
  }
}
