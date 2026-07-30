import { describe, expect, it, vi } from 'vitest'
import { activateWaitingWorker, watchWaitingWorker } from './sw-update'

class FakeWorker {
  state = 'installing'
  readonly posted: unknown[] = []
  private readonly listeners = new Set<() => void>()

  get listenerCount() {
    return this.listeners.size
  }

  addEventListener(_type: 'statechange', listener: () => void) {
    this.listeners.add(listener)
  }

  removeEventListener(_type: 'statechange', listener: () => void) {
    this.listeners.delete(listener)
  }

  emitStateChange() {
    for (const listener of [...this.listeners]) listener()
  }
}

/** Mimics the parts of ServiceWorkerRegistration the watcher observes. */
class FakeRegistration {
  installing: FakeWorker | null = null
  waiting: FakeWorker | null = null
  updates = 0
  private readonly listeners = new Set<() => void>()

  get listenerCount() {
    return this.listeners.size
  }

  addEventListener(_type: 'updatefound', listener: () => void) {
    this.listeners.add(listener)
  }

  removeEventListener(_type: 'updatefound', listener: () => void) {
    this.listeners.delete(listener)
  }

  update() {
    this.updates += 1
    return Promise.resolve()
  }

  /** A new worker is fetched and starts installing. */
  startInstall() {
    const worker = new FakeWorker()
    this.installing = worker
    for (const listener of [...this.listeners]) listener()
    return worker
  }

  /** The browser moves the worker to `waiting` before firing `statechange`. */
  finishInstall(worker: FakeWorker) {
    this.installing = null
    this.waiting = worker
    worker.state = 'installed'
    worker.emitStateChange()
  }

  /** The waiting worker is told to skip waiting and takes over. */
  activate(worker: FakeWorker) {
    this.waiting = null
    worker.state = 'activated'
    worker.emitStateChange()
  }
}

const install = (registration: FakeRegistration) => {
  const worker = registration.startInstall()
  registration.finishInstall(worker)
  return worker
}

describe('watchWaitingWorker', () => {
  it('reports a worker that was already waiting before the watch started', () => {
    const registration = new FakeRegistration()
    const waiting = new FakeWorker()
    waiting.state = 'installed'
    registration.waiting = waiting
    const onChange = vi.fn()

    watchWaitingWorker(registration, onChange)

    expect(onChange).toHaveBeenCalledWith(waiting)
  })

  it('stays quiet while nothing is waiting', () => {
    const registration = new FakeRegistration()
    const onChange = vi.fn()

    watchWaitingWorker(registration, onChange)

    expect(onChange).not.toHaveBeenCalled()
  })

  it('reports a worker that finishes installing while watching', () => {
    const registration = new FakeRegistration()
    const onChange = vi.fn()
    watchWaitingWorker(registration, onChange)

    const waiting = install(registration)

    expect(onChange).toHaveBeenCalledExactlyOnceWith(waiting)
  })

  it('reports every later update in a long-running app, not just the first', () => {
    const registration = new FakeRegistration()
    const onChange = vi.fn()
    watchWaitingWorker(registration, onChange)

    const first = install(registration)
    registration.activate(first)
    const second = install(registration)

    expect(onChange.mock.calls).toEqual([[first], [null], [second]])
  })

  it('reports the same waiting worker only once', () => {
    const registration = new FakeRegistration()
    const onChange = vi.fn()
    watchWaitingWorker(registration, onChange)

    const waiting = registration.startInstall()
    registration.finishInstall(waiting)
    waiting.emitStateChange()

    expect(onChange).toHaveBeenCalledExactlyOnceWith(waiting)
  })

  it('reports null once the waiting worker takes over', () => {
    const registration = new FakeRegistration()
    const onChange = vi.fn()
    watchWaitingWorker(registration, onChange)

    const waiting = install(registration)
    registration.activate(waiting)

    expect(onChange.mock.calls).toEqual([[waiting], [null]])
  })

  it('detaches every listener when stopped', () => {
    const registration = new FakeRegistration()
    const stop = watchWaitingWorker(registration, vi.fn())
    const worker = registration.startInstall()

    stop()

    expect(registration.listenerCount).toBe(0)
    expect(worker.listenerCount).toBe(0)
  })

  it('ignores events that arrive after it was stopped', () => {
    const registration = new FakeRegistration()
    const onChange = vi.fn()
    const stop = watchWaitingWorker(registration, onChange)

    stop()
    install(registration)

    expect(onChange).not.toHaveBeenCalled()
  })
})

describe('activateWaitingWorker', () => {
  it('asks the waiting worker to skip waiting', () => {
    const waiting = new FakeWorker()

    activateWaitingWorker(waiting)

    expect(waiting.posted).toEqual([{ type: 'SKIP_WAITING' }])
  })
})
