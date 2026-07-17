import type { RxCollection } from 'rxdb'
import type { Identifiable, Repository, Unsubscribe } from './base-repository'

export class RxdbRepository<T extends Identifiable> implements Repository<T> {
  private readonly collection: Promise<RxCollection<T>>

  constructor(collection: RxCollection<T> | PromiseLike<RxCollection<T>>) {
    this.collection = Promise.resolve(collection)
  }

  async getAll(): Promise<T[]> {
    const collection = await this.collection
    const docs = await collection.find().exec()
    return docs.map((doc) => doc.toMutableJSON() as T)
  }

  async getById(id: string): Promise<T | null> {
    const collection = await this.collection
    const doc = await collection.findOne(id).exec()
    return doc ? (doc.toMutableJSON() as T) : null
  }

  async save(entity: T): Promise<T> {
    const collection = await this.collection
    const doc = await collection.upsert(entity)
    return doc.toMutableJSON() as T
  }

  async remove(id: string): Promise<void> {
    const collection = await this.collection
    const doc = await collection.findOne(id).exec()
    if (doc) await doc.remove()
  }

  observe(listener: (entities: T[]) => void): Unsubscribe {
    let subscription: { unsubscribe: () => void } | undefined
    let cancelled = false
    void this.collection.then((collection) => {
      if (cancelled) return
      subscription = collection.find().$.subscribe((docs) => {
        listener(docs.map((doc) => doc.toMutableJSON() as T))
      })
    })
    return () => {
      cancelled = true
      subscription?.unsubscribe()
    }
  }
}
