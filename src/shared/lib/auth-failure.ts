/**
 * Why the server refused this device, when it did. A Sync failure that is really an auth failure
 * reads as gibberish in the banner (`invalid JWT: unable to parse or verify signature`), and the
 * one thing that would fix it — signing in again — is not what the banner offers. Two kinds are
 * worth telling apart: a token the server will accept once refreshed, and a device clock so far
 * off that every token it is handed looks issued in the future. Only the learner can fix the
 * second, and only if the app says so.
 */
export type AuthFailure = 'token' | 'clock'

const CLOCK = /before issued|issued in the future|iat.*future|future.*iat/i
const TOKEN =
  /\bjwt\b|\bjws\b|\bpgrst30[01]\b|\b401\b|unauthorized|not authenticated|invalid claim/i

export function authFailure(reason: string): AuthFailure | null {
  if (!reason) return null
  if (CLOCK.test(reason)) return 'clock'
  return TOKEN.test(reason) ? 'token' : null
}
