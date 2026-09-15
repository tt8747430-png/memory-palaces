interface Startable {
  getState(): { start: () => void }
}

export function started<S extends Startable>(store: S): S {
  store.getState().start()
  return store
}
