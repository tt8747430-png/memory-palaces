interface Startable {
  getState(): { start: () => void }
}

/**
 * Subscribes a store to its repository the way the composition root does, so a test renders against
 * a store already holding its seed rows.
 */
export function started<S extends Startable>(store: S): S {
  store.getState().start()
  return store
}
