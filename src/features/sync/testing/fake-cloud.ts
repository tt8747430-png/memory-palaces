import {
  type Checkpoint,
  type CloudDocument,
  type CloudSyncPort,
  type Identifiable,
  InMemoryRepository,
  isAfterCheckpoint,
  type PushedIds,
  type RemoteChange,
  type RemoteParents,
} from '@/shared/api'
import { type ContentCollection, type SyncedTable } from '@/shared/config/sync-tables'
import { started } from '@/shared/test/started'
import { createDeckStore, type Deck } from '@/entities/deck'
import { type Card, createCardStore } from '@/entities/card'
import { createFolderStore, type Folder } from '@/entities/folder'
import { createQuestionStore, type Question } from '@/entities/question'
import {
  createPendingChangeStore,
  type PendingChange,
  selectPendingChanges,
} from '@/entities/pending-change'
import { createSyncStateStore, DEFAULT_SYNC_STATE, type SyncState } from '@/entities/sync-state'
import { localIds } from '../content-collections'
import { createPendingChangePort } from '../create-pending-change-port'
import type { SyncDeps } from '../sync-deps'

interface CloudRow {
  id: string
  updated_at: string
  deleted: boolean
  data: Identifiable & Record<string, unknown>
}

type CloudData = Identifiable & Record<string, unknown>

export interface FakeCloud extends CloudSyncPort {
  write<T extends Identifiable>(table: SyncedTable, data: T, deleted?: boolean): void
  row(table: SyncedTable, id: string): CloudRow | undefined
  duringCycle?: () => void | Promise<void>
  pull?: (deps: SyncDeps) => void | Promise<void>
  failNextCycle(reason: string): void
  cycles: number
  fetched: { table: SyncedTable; ids: readonly string[] }[]
}

const stamp = (tick: number) => `2026-02-01T00:00:00.${String(tick).padStart(3, '0')}Z`

export const AT = '2026-01-01T00:00:00.000Z'
export const NOW = '2026-03-01T12:00:00.000Z'

interface Repositories {
  decks: InMemoryRepository<Deck>
  folders: InMemoryRepository<Folder>
  cards: InMemoryRepository<Card>
  questions: InMemoryRepository<Question>
}

const readLocal = async (
  repos: Repositories,
  collection: ContentCollection,
  id: string,
): Promise<CloudData | null> =>
  (await (repos[collection] as unknown as InMemoryRepository<CloudData>).getById(id)) ?? null

export function syncFixture(options: { state?: Partial<SyncState> } = {}) {
  const tables = new Map<SyncedTable, Map<string, CloudRow>>()
  const table = (name: SyncedTable) => {
    const found = tables.get(name) ?? new Map<string, CloudRow>()
    tables.set(name, found)
    return found
  }
  let tick = 0
  let failure: string | null = null

  const repos: Repositories = {
    decks: new InMemoryRepository<Deck>(),
    folders: new InMemoryRepository<Folder>(),
    cards: new InMemoryRepository<Card>(),
    questions: new InMemoryRepository<Question>(),
  }
  const pendingChangeStore = started(
    createPendingChangeStore(new InMemoryRepository<PendingChange>()),
  )
  const port = (collection: ContentCollection) =>
    createPendingChangePort(pendingChangeStore, collection, () => AT)

  const cloud: FakeCloud = {
    cycles: 0,
    fetched: [],
    write(name, data, deleted = false) {
      table(name).set(data.id, {
        id: data.id,
        updated_at: stamp(++tick),
        deleted,
        data: { ...data } as CloudData,
      })
    },
    row: (name, id) => table(name).get(id),
    failNextCycle(reason) {
      failure = reason
    },
    async peek(name, checkpoint: Checkpoint | null): Promise<RemoteChange[]> {
      return [...table(name).values()]
        .filter((row) => isAfterCheckpoint(row, checkpoint))
        .sort((a, b) => a.updated_at.localeCompare(b.updated_at) || a.id.localeCompare(b.id))
        .map(({ id, updated_at, deleted }) => ({ id, updated_at, deleted }))
    },
    async parents(name, ids): Promise<RemoteParents[]> {
      return ids.flatMap((id) => {
        const row = table(name).get(id)
        if (!row) return []
        const { deckId, parentId, folderId } = row.data as Record<string, string | null | undefined>
        return [{ id, deckId, parentId, folderId }]
      })
    },
    async fetch<T extends Identifiable>(
      name: SyncedTable,
      ids: readonly string[],
    ): Promise<CloudDocument<T>[]> {
      cloud.fetched.push({ table: name, ids })
      return ids.flatMap((id) => {
        const row = table(name).get(id)
        return row ? [{ ...row.data, _deleted: row.deleted } as CloudDocument<T>] : []
      })
    },
    async runCycle(): Promise<PushedIds> {
      cloud.cycles += 1
      await cloud.duringCycle?.()
      if (failure) {
        const reason = failure
        failure = null
        throw new Error(reason)
      }
      const pushed: Partial<Record<SyncedTable, string[]>> = {}
      for (const change of selectPendingChanges(pendingChangeStore.getState())) {
        const document =
          change.op === 'save'
            ? await readLocal(repos, change.contentCollection, change.entityId)
            : (table(change.contentCollection).get(change.entityId)?.data ?? {
                id: change.entityId,
              })
        if (!document) continue
        cloud.write(change.contentCollection, document, change.op === 'remove')
        pushed[change.contentCollection] = [
          ...(pushed[change.contentCollection] ?? []),
          change.entityId,
        ]
      }
      await cloud.pull?.(deps)
      return pushed
    },
  }

  const syncStateRepo = new InMemoryRepository<SyncState>([
    { ...DEFAULT_SYNC_STATE, ...options.state },
  ])
  const deps: SyncDeps = {
    cloud,
    pendingChangeStore,
    syncStateStore: started(createSyncStateStore(syncStateRepo)),
    deckStore: started(createDeckStore(repos.decks, port('decks'))),
    folderStore: started(createFolderStore(repos.folders, port('folders'))),
    cardStore: started(createCardStore(repos.cards, port('cards'))),
    questionStore: started(createQuestionStore(repos.questions, port('questions'))),
    now: () => NOW,
    isOnline: () => true,
  }

  const pullEverything = async () => {
    for (const collection of ['folders', 'decks', 'cards', 'questions'] as const) {
      const here = localIds(deps, collection)
      for (const row of table(collection).values()) {
        if (row.deleted || here.has(row.id)) continue
        await (repos[collection] as unknown as InMemoryRepository<CloudData>).save(row.data)
      }
    }
  }

  return {
    cloud,
    deps,
    repos,
    pullEverything,
    log: () => selectPendingChanges(pendingChangeStore.getState()),
  }
}
