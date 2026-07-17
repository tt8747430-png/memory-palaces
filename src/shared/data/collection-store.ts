import { Observable } from './observable'
import type { Identifiable, Repository, Unsubscribe } from './base-repository'

export type StoreStatus = 'idle' | 'loading' | 'ready'

/**
 * Reactive collection store over a Repository<T>: `start()` subscribes to the
 * repository's live query and mirrors it into observables; writes delegate to the
 * repository and flow back through the subscription.
 */
export abstract class CollectionStore<T extends Identifiable> {
  /** Sort applied to every emission; source order when null. */
  protected readonly compare: ((a: T, b: T) => number) | null = null

  constructor(protected readonly repo: Repository<T>) {}

  private readonly _entities = new Observable<T[]>([])
  private readonly _status = new Observable<StoreStatus>('idle')
  readonly entities = this._entities.asReadonly()
  readonly status = this._status.asReadonly()

  private unsubscribe: Unsubscribe | null = null

  start(): void {
    if (this.unsubscribe) return
    this._status.set('loading')
    this.unsubscribe = this.repo.observe((entities) => {
      this._entities.set(this.compare ? [...entities].sort(this.compare) : entities)
      this._status.set('ready')
    })
  }

  stop(): void {
    this.unsubscribe?.()
    this.unsubscribe = null
  }

  save(entity: T): Promise<T> {
    return this.repo.save(entity)
  }

  remove(id: string): Promise<void> {
    return this.repo.remove(id)
  }
}
