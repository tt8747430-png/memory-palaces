export interface ScheduledDeletion {
  requestedAt: string
  purgeAfter: string
}

export interface AccountDeletionPort {
  scheduled(): Promise<ScheduledDeletion | null>
  request(): Promise<ScheduledDeletion>
  cancel(): Promise<void>
}
