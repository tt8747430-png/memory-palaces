export interface WorkerLike {
  readonly state: string
  addEventListener: (type: 'statechange', listener: () => void) => void
  removeEventListener: (type: 'statechange', listener: () => void) => void
  postMessage: (message: unknown) => void
}

export interface RegistrationLike {
  readonly installing: WorkerLike | null
  readonly waiting: WorkerLike | null
  addEventListener: (type: 'updatefound', listener: () => void) => void
  removeEventListener: (type: 'updatefound', listener: () => void) => void
}

const SKIP_WAITING = { type: 'SKIP_WAITING' }

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

export function activateWaitingWorker(waiting: WorkerLike): void {
  waiting.postMessage(SKIP_WAITING)
}
