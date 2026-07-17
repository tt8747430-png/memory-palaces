export type Unsubscribe = () => void

export interface ReadonlyObservable<T> {
  get(): T
  subscribe(listener: () => void): Unsubscribe
}

/**
 * The reactivity primitive the store base classes are built on — the React-side
 * replacement for Angular's `signal`. Framework-agnostic by design: React binds
 * to it through `useStore`, and tests read it with no React in the room.
 */
export class Observable<T> implements ReadonlyObservable<T> {
  private listeners = new Set<() => void>()
  private readonly readonlyView: ReadonlyObservable<T>

  constructor(private value: T) {
    this.readonlyView = { get: this.get, subscribe: this.subscribe }
  }

  /** Arrow property: `useSyncExternalStore` requires a stable reference. */
  readonly get = (): T => this.value

  /** Arrow property: `useSyncExternalStore` requires a stable reference. */
  readonly subscribe = (listener: () => void): Unsubscribe => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  set(next: T): void {
    if (Object.is(next, this.value)) return
    this.value = next
    // Copy first: a listener may unsubscribe itself during notification.
    for (const listener of [...this.listeners]) listener()
  }

  asReadonly(): ReadonlyObservable<T> {
    return this.readonlyView
  }
}
