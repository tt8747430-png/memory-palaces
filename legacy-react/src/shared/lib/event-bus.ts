export type EventHandler<T> = (payload: T) => void

export class EventBus<Events extends Record<string, unknown>> {
  private readonly handlers = new Map<keyof Events, Set<EventHandler<never>>>()

  on<K extends keyof Events>(type: K, handler: EventHandler<Events[K]>): () => void {
    const set = this.handlers.get(type) ?? new Set<EventHandler<never>>()
    set.add(handler as EventHandler<never>)
    this.handlers.set(type, set)
    return () => this.off(type, handler)
  }

  off<K extends keyof Events>(type: K, handler: EventHandler<Events[K]>): void {
    this.handlers.get(type)?.delete(handler as EventHandler<never>)
  }

  emit<K extends keyof Events>(type: K, payload: Events[K]): void {
    this.handlers.get(type)?.forEach((handler) => {
      ;(handler as EventHandler<Events[K]>)(payload)
    })
  }

  clear(): void {
    this.handlers.clear()
  }
}
