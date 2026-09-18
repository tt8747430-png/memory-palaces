/**
 * How long one PostgREST request of a Sync may take. Without a bound, one hung fetch leaves
 * "Synchronising…" up for good — and every later Sync joins the same in-flight promise.
 */
export const REQUEST_TIMEOUT_MS = 30_000

export const requestSignal = (): AbortSignal => AbortSignal.timeout(REQUEST_TIMEOUT_MS)
