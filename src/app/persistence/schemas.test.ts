import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import type { RxCollection } from 'rxdb'
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie'
import { createAppDatabase } from './database'

interface SchemaShape {
  primaryKey: unknown
  required?: readonly (string | number | symbol)[]
  indexes?: readonly (string | readonly string[])[]
  properties: Record<string, { type?: unknown; enum?: readonly unknown[] } | undefined>
}

function minimalDocument(schema: SchemaShape): Record<string, unknown> {
  const primaryPath = String(schema.primaryKey)
  const fields = new Set([
    ...(schema.required ?? []).map(String),
    ...(schema.indexes ?? []).flatMap((index) => (Array.isArray(index) ? index : [index])),
    primaryPath,
  ])
  const document: Record<string, unknown> = {}
  for (const field of fields) {
    const property = schema.properties[String(field)]
    if (!property) continue
    const types = Array.isArray(property.type) ? property.type : [property.type]
    if (property.enum?.length) document[String(field)] = property.enum[0]
    else if (types.includes('string'))
      document[String(field)] = field === primaryPath ? 'id-1' : 'x'
    else if (types.includes('number')) document[String(field)] = 0
    else if (types.includes('boolean')) document[String(field)] = false
    else if (types.includes('array')) document[String(field)] = []
    else if (types.includes('object')) document[String(field)] = {}
    else document[String(field)] = null
  }
  return document
}

const DOCUMENT_MEMBERS = [
  'remove',
  'patch',
  'incrementalPatch',
  'update',
  'toJSON',
  'toMutableJSON',
] as const

function firstEmission<T>(source: {
  subscribe: (observer: { next: (value: T) => void; error: (error: unknown) => void }) => {
    unsubscribe: () => void
  }
}): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const subscription = source.subscribe({
      next: (value) => {
        resolve(value)
        queueMicrotask(() => subscription.unsubscribe())
      },
      error: reject,
    })
  })
}

async function roundTrip(collection: RxCollection): Promise<void> {
  const document = minimalDocument(collection.schema.jsonSchema)
  await collection.upsert(document)

  const emitted = await firstEmission<unknown[]>(collection.find().$)
  if (emitted.length !== 1) throw new Error(`the query emitted ${emitted.length} documents, not 1`)

  const stored = await collection
    .findOne(String(document[String(collection.schema.primaryPath)]))
    .exec()
  if (!stored) throw new Error('the document did not read back')

  const shadowed = DOCUMENT_MEMBERS.filter(
    (member) => typeof (stored as unknown as Record<string, unknown>)[member] !== 'function',
  )
  if (shadowed.length) throw new Error(`a schema field shadows ${shadowed.join(', ')}`)

  await stored.remove()
}

describe('every collection the app opens', () => {
  it('writes, reads and removes a document, shadowing none of RxDB’s own', async () => {
    const collections = await createAppDatabase(getRxStorageDexie())

    const broken: string[] = []
    for (const [name, collection] of Object.entries(collections)) {
      try {
        await roundTrip(collection)
      } catch (error) {
        broken.push(`${name}: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
    await collections.decks.database.remove()

    expect(broken).toEqual([])
  })
})
