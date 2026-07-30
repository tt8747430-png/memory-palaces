/**
 * Detecting a downloaded-but-not-yet-active app update.
 *
 * `registration.waiting` is the ground truth: once a new service worker
 * finishes installing it sits in `waiting` until it is told to take over, so a
 * watcher that starts at any moment still sees a pending update. Detection here
 * therefore never depends on having witnessed the `updatefound` event that
 * produced the worker — workbox-window classifies any update found more than a
 * minute after registration as "external" and then stops listening for further
 * ones, which loses every update after the first in an app that stays open.
 */

/** The parts of `ServiceWorker` this module touches. */
export interface WorkerLike {
  readonly state: string
  addEventListener: (type: 'statechange', listener: () => void) => void
  removeEventListener: (type: 'statechange', listener: () => void) => void
  postMessage: (message: unknown) => void
}

/** The parts of `ServiceWorkerRegistration` this module touches. */
export interface RegistrationLike {
  readonly installing: WorkerLike | null
  readonly waiting: WorkerLike | null
  addEventListener: (type: 'updatefound', listener: () => void) => void
  removeEventListener: (type: 'updatefound', listener: () => void) => void
}

/** The message the generated service worker listens for to hand over control. */
const SKIP_WAITING = { type: 'SKIP_WAITING' }

/**
 * Reports the worker waiting to take over — immediately if one already is, and
 * again whenever that changes. Returns a function that detaches every listener.
 */
export function watchWaitingWorker(
  registration: RegistrationLike,
  onWaitingChange: (waiting: WorkerLike | null) => void,
): () => void {
  const watched = new Map<WorkerLike, () => void>()
  let reported: WorkerLike | null = null
  let stopped = false

  const report = () => {
    if (stopped || registration.waiting === reported) return
    reported = registration.waiting
    onWaitingChange(reported)
  }

  const unwatch = (worker: WorkerLike) => {
    const listener = watched.get(worker)
    if (!listener) return
    worker.removeEventListener('statechange', listener)
    watched.delete(worker)
  }

  // A worker only reaches `waiting` by passing through `installing`, so follow
  // each installing worker until it either waits or turns out to be redundant.
  const watchInstalling = () => {
    const installing = registration.installing
    if (stopped || !installing || watched.has(installing)) return
    const listener = () => {
      report()
      if (installing.state === 'activated' || installing.state === 'redundant') {
        unwatch(installing)
      }
    }
    watched.set(installing, listener)
    installing.addEventListener('statechange', listener)
  }

  registration.addEventListener('updatefound', watchInstalling)
  watchInstalling()

  // A worker that was already waiting — installed during an earlier run, or
  // while this page was starting up — never fires an event we could observe.
  const waiting = registration.waiting
  if (waiting) {
    const listener = () => {
      report()
      if (waiting.state === 'activated' || waiting.state === 'redundant') unwatch(waiting)
    }
    watched.set(waiting, listener)
    waiting.addEventListener('statechange', listener)
  }
  report()

  return () => {
    stopped = true
    registration.removeEventListener('updatefound', watchInstalling)
    for (const worker of [...watched.keys()]) unwatch(worker)
  }
}

/** Tells the waiting worker to take over. It then claims every open client. */
export function activateWaitingWorker(waiting: WorkerLike): void {
  waiting.postMessage(SKIP_WAITING)
}
