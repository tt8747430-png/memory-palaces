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
    if (!('updatedAt' in collection.schema.jsonSchema.properties)) {
      await doc.remove()
      return
    }
    const clocked = doc as unknown as RxDocument<Identifiable & Clocked>
    const stamped = await clocked.incrementalPatch({ updatedAt: nowIso() })
    await stamped.remove()
  }

  /**
   * Every emission is the whole collection, so a copy per document per emission made one write cost
   * a deep clone of everything and handed every subscriber all-new objects — no memo downstream
   * could ever hold. RxDB reuses a document instance while its revision stands and makes a new one
   * when it changes, so the plain copy is cached per instance: an unchanged document is the same
   * object across emissions, and a changed one is a new object, exactly as immutable data should be.
   */
  observe(listener: (entities: T[]) => void): Unsubscribe {
    let subscription: { unsubscribe: () => void } | undefined
    let cancelled = false
    const plain = new WeakMap<RxDocument<T>, T>()
    const toPlain = (doc: RxDocument<T>): T => {
      let entity = plain.get(doc)
      if (!entity) {
        entity = doc.toMutableJSON() as T
        plain.set(doc, entity)
      }
      return entity
    }
    void this.collection.then((collection) => {
      if (cancelled) return
      subscription = collection.find().$.subscribe((docs) => {
        listener(docs.map(toPlain))
      })
    })
    return () => {
      cancelled = true
      subscription?.unsubscribe()
    }
  }
}
