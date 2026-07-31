/**
 * Detecting a downloaded-but-not-yet-active app update.
 *
 * `registration.waiting` is the ground truth: an installed worker sits there until told to take
 * over, so a watcher starting at any moment still sees a pending update. Never depends on having
 * witnessed the `updatefound` event — workbox-window calls any update found more than a minute
 * after registration "external" and stops listening, losing every update after the first in an app
 * left open.
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
 * Reports the worker waiting to take over — immediately if one already is, again whenever that
 * changes. Returns a detach function.
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

  // A worker only reaches `waiting` through `installing` — follow each until it waits or goes
  // redundant.
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

  // Already waiting — installed on an earlier run, or while this page booted — fires no observable
  // event.
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
