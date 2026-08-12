/** Where the provider sent the browser back to, and what it said when it got there. */
export interface AuthCallback {
  /** The PKCE authorization code, when the redirect carried one. */
  code: string | null
  /** True when the provider refused (declined consent, expired link, and so on). */
  refused: boolean
  /** Where to go once a session exists. Recovery links must reach a set-password screen. */
  next: 'recovery' | 'home'
}

/**
 * Reads an OAuth/recovery return URL. Kept out of the component so the shape of a provider redirect
 * is testable on its own — and so the page never has to reason about query strings.
 */
export function parseAuthCallback(search: string): AuthCallback {
  const params = new URLSearchParams(search)
  return {
    code: params.get('code'),
    refused: Boolean(params.get('error') ?? params.get('error_description')),
    next: params.get('next') === 'recovery' ? 'recovery' : 'home',
  }
}
