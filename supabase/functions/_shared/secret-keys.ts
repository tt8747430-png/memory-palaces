// The project's secret API keys, as the platform hands them to a function: `SUPABASE_SECRET_KEYS`
// is a JSON object keyed by the name each key was given in the Dashboard.
//
// Secret keys, not the legacy `service_role` JWT: the app is on publishable keys, and the two go
// together — a secret key can be rotated on its own, refuses to work from a browser, and is what
// `pg_net` has to send on the `apikey` header, because it is not a JWT and the platform's
// `verify_jwt` would reject it on `Authorization`. Both functions run with `verify_jwt = false`
// and do their own checking for the same reason.

/** Every secret key the project has, by name. Throws where none have been created yet. */
export function secretKeys(): Record<string, string> {
  const raw = Deno.env.get('SUPABASE_SECRET_KEYS')
  if (!raw) {
    throw new Error(
      'SUPABASE_SECRET_KEYS is not set — create publishable and secret API keys for the project',
    )
  }
  return JSON.parse(raw) as Record<string, string>
}

/** One secret key to act as the platform with. Any of them will do; they are all elevated. */
export function secretKey(): string {
  const [key] = Object.values(secretKeys())
  if (!key) throw new Error('SUPABASE_SECRET_KEYS holds no keys')
  return key
}

/**
 * Whether `request` carries one of the project's secret keys on the `apikey` header.
 *
 * The keys are read first, and deliberately: a project with none configured then fails loudly on
 * every call rather than answering a quiet 403 that reads exactly like a caller who sent the wrong
 * key — and a cron job refused for the wrong reason is a cron job nobody comes back to.
 */
export function sentSecretKey(request: Request): boolean {
  const keys = Object.values(secretKeys())
  const sent = request.headers.get('apikey')
  return sent !== null && keys.includes(sent)
}
