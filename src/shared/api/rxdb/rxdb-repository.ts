import type { RxCollection, RxDocument } from 'rxdb'
import type { Identifiable, Repository, Unsubscribe } from '@/shared/api'
import { type Clocked, nowIso } from '@/shared/lib'

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
    if (!doc) return
    // Collections whose schema has no clock are device-local and never replicate.
    if (!('updatedAt' in collection.schema.jsonSchema.properties)) {
      await doc.remove()
      return
    }
    // A tombstone is a write, and it competes on the same clock as an edit. Removing without
    // dating it leaves the delete carrying whenever the document was last *edited*, so another
    // device's edit made before the delete but stamped later wins the merge and resurrects it.
    const clocked = doc as unknown as RxDocument<Identifiable & Clocked>
    const stamped = await clocked.incrementalPatch({ updatedAt: nowIso() })
    await stamped.remove()
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
