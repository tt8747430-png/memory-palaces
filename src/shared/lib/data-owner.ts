const OWNER_KEY = 'mindscape:data-owner'

/**
 * Which account the data sitting on this device belongs to.
 *
 * The question outlives everything that could answer it from memory. Signing out clears the
 * session, so the next sign-in has no previous identity to compare against; a reset wipes RxDB and
 * reloads the page, so the answer cannot live in the database either. Without a record that
 * survives both, signing out and back in as *someone else* reads as a first sign-in — and the
 * previous account's decks, cards and progress get pushed into the new account.
 */
export interface DataOwner {
  read(): string | null
  claim(userId: string): void
}

export const localDataOwner: DataOwner = {
  read: () => localStorage.getItem(OWNER_KEY),
  claim: (userId) => localStorage.setItem(OWNER_KEY, userId),
}
