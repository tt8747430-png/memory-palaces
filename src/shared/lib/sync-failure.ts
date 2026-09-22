/**
 * Why a Sync failed, when the reason is one the app should put in its own words. The raw message
 * reads as gibberish in the banner and the log (`invalid JWT: unable to parse or verify signature`,
 * `AbortError: Fetch is aborted`), and none of it says what to do. Three kinds are worth telling
 * apart: a token the server will accept once refreshed; a device clock so far off that every token
 * it is handed looks issued in the future — only the learner can fix that, and only if the app
 * says so; and a request that never got an answer — dropped, aborted, or past its timeout — which
 * the next Sync simply tries again.
 */
export type SyncFailure = 'token' | 'clock' | 'network'

const CLOCK = /before issued|issued in the future|iat.*future|future.*iat/i
const TOKEN =
  /\bjwt\b|\bjws\b|\bpgrst30[01]\b|\b401\b|unauthorized|not authenticated|invalid claim/i
/** Every browser's words for a fetch that was cut short: Chrome, Safari, Firefox, and a signal. */
const NETWORK = /abort|timed out|timeout|failed to fetch|load failed|networkerror|network error/i

export function syncFailure(reason: string): SyncFailure | null {
  if (!reason) return null
  if (CLOCK.test(reason)) return 'clock'
  if (TOKEN.test(reason)) return 'token'
  return NETWORK.test(reason) ? 'network' : null
}
