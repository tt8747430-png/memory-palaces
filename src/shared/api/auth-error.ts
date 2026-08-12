/**
 * An auth failure with the provider's machine-readable code preserved.
 *
 * The message alone is developer-facing ("email rate limit exceeded"); the code is what lets the UI
 * choose copy a person can act on. Anything unrecognised keeps its message, so a new provider error
 * still surfaces rather than vanishing into a generic apology.
 */
export class AuthError extends Error {
  constructor(
    message: string,
    readonly code: string = 'unknown',
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

export const isAuthError = (error: unknown): error is AuthError => error instanceof AuthError
