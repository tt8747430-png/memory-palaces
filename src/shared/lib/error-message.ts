/** The sentence an unknown thrown value carries — what a failed Sync or request reports. */
export const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)
