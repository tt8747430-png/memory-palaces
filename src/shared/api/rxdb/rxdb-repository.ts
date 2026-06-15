import type { RxCollection } from 'rxdb'
import type { Identifiable, Repository, Unsubscribe } from '../base-repository'

/**
 * RxDB adapter for the generic {@link Repository} port — the on-device source of
 * truth (IndexedDB via Dexie in the browser, in-memory in tests). One generic
 * adapter serves every entity: the concrete schema + storage are chosen at the
 * composition root, never here, so `shared` stays free of entity types.
 *
 * The collection is accepted as a promise because opening an RxDB collection is
 * async while the port is constructed synchronously; each call awaits it once.
 * `toMutableJSON()` returns a fresh, meta-field-free copy, satisfying the port's
 * no-aliasing contract.
 */
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
      // `find().$` is a BehaviorSubject — it replays the current results on subscribe.
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
