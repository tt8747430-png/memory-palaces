export type Unsubscribe = () => void

/**
 * A read-only reactive value, callable like an Angular signal: `count()` reads
 * the current value. `.get()` is the same read (the stable reference
 * `useSyncExternalStore` needs), and `.subscribe()` registers a change listener.
 *
 * Keeping the read callable is load-bearing: the ~7,600-line framework-agnostic
 * core reads every store selector as `store.decks()` / `store.value()`. Matching
 * that ergonomics is what lets the core cross the framework change untouched.
 */
export interface ReadonlyObservable<T> {
  (): T
  get(): T
  subscribe(listener: () => void): Unsubscribe
}

/**
 * The reactivity primitive the store base classes are built on — the React-side
 * replacement for Angular's `signal`. Framework-agnostic by design: React binds
 * to it through `useStore`, and tests read it with no React in the room.
 */
export class Observable<T> {
  private listeners = new Set<() => void>()
  private readonly readonlyView: ReadonlyObservable<T>

  constructor(private value: T) {
    const view = (() => this.value) as ReadonlyObservable<T>
    view.get = this.get
    view.subscribe = this.subscribe
    this.readonlyView = view
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

/**
 * A derived read-only value — the replacement for Angular's `computed` for the
 * single-source selectors the stores expose (`effective`, `unreadCount`,
 * `level`, …). Recomputes eagerly when `source` changes and dedupes with the
 * same `Object.is` guard as `Observable`, so a projection that lands on the same
 * value re-renders nothing. The subscription lives for the store's lifetime,
 * which is the app's — stores are singletons, so there is nothing to tear down.
 */
export function derived<T, R>(
  source: ReadonlyObservable<T>,
  project: (value: T) => R,
): ReadonlyObservable<R> {
  const out = new Observable<R>(project(source.get()))
  source.subscribe(() => out.set(project(source.get())))
  return out.asReadonly()
}
