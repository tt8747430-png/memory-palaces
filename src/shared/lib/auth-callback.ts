export interface AuthCallback {
  code: string | null
  refused: boolean
  next: 'recovery' | 'home'
}

export function parseAuthCallback(search: string): AuthCallback {
  const params = new URLSearchParams(search)
  return {
    code: params.get('code'),
    refused: Boolean(params.get('error') ?? params.get('error_description')),
    next: params.get('next') === 'recovery' ? 'recovery' : 'home',
  }
}
