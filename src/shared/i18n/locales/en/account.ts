/** The account lifecycle: requesting deletion, and a deletion already scheduled. */
export const account = {
  scheduledTitle: 'Scheduled for deletion',
  scheduledBody:
    'This account and everything in it will be destroyed on {{date}}. Cancel now to keep it.',
  checking: 'Checking your account…',
  cancelDeletion: 'Cancel deletion',
  cancelling: 'Cancelling…',
  cancelFailed: 'The deletion could not be cancelled. Try again.',
  cancelOffline: "You're offline. Cancelling needs a connection — reconnect and try again.",
  signOut: 'Sign out',
  delete: {
    title: 'Delete your account?',
    body: 'Your account and everything in it will be destroyed on {{date}}. Until then, signing back in cancels it.',
    preparing: 'Synchronising your decks first, so nothing on this device is lost…',
    confirmLabel: 'Type {{word}} to confirm',
    confirmWord: 'DELETE',
    confirm: 'Schedule deletion',
    submitting: 'Scheduling…',
    offline: "You're offline. Deleting an account needs a connection — reconnect and try again.",
    syncFailed:
      'Nothing was deleted — your decks could not be synchronised first. Check your connection and try again.',
    needsReview: 'Some deletions need your answer before this can go ahead.',
    failed: 'Your account could not be scheduled for deletion. Try again.',
    retry: 'Try again',
    scheduled: 'Your account will be deleted on {{date}}. Sign in before then to cancel.',
  },
} as const
