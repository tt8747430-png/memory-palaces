import { signal } from '@angular/core'
import type { Identifiable, Repository, Unsubscribe } from './base-repository'
import type { StoreStatus } from './collection-store'

/**
 * Store for collections that hold at most one document (preferences, profile,
 * progress): mirrors the first document — or null — into a signal.
 */
export abstract class SingletonDocStore<T extends Identifiable> {
  constructor(protected readonly repo: Repository<T>) {}

  private readonly _value = signal<T | null>(null)
  private readonly _status = signal<StoreStatus>('idle')
  readonly value = this._value.asReadonly()
  readonly status = this._status.asReadonly()

  private unsubscribe: Unsubscribe | null = null

  start(): void {
    if (this.unsubscribe) return
    this._status.set('loading')
    this.unsubscribe = this.repo.observe((all) => {
      this._value.set(all[0] ?? null)
      this._status.set('ready')
    })
  }

  stop(): void {
    this.unsubscribe?.()
    this.unsubscribe = null
  }

  save(value: T): Promise<T> {
    return this.repo.save(value)
  }
}
