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
