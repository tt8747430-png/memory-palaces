import { createRxDatabase } from 'rxdb'
import type { RxCollection, RxStorage } from 'rxdb'
import type { Folder } from '@/entities/folder'
import type { Palace } from '@/entities/palace'
import type { Room } from '@/entities/room'
import type { Locus } from '@/entities/locus'
import { STORAGE_PREFIX } from '@/shared/config/constants'
import { folderSchema, locusSchema, palaceSchema, roomSchema } from './schemas'

export interface AppCollections {
  palaces: RxCollection<Palace>
  folders: RxCollection<Folder>
  rooms: RxCollection<Room>
  loci: RxCollection<Locus>
}

/**
 * Create the on-device RxDB database and its entity collections. Storage is injected
 * (Dexie/IndexedDB in the browser); the composition root calls this once and wires the
 * collections into `RxdbRepository` adapters behind the entity ports.
 */
export async function createAppDatabase<Internals, InstanceCreationOptions>(
  storage: RxStorage<Internals, InstanceCreationOptions>,
): Promise<AppCollections> {
  const database = await createRxDatabase({ name: STORAGE_PREFIX, storage })
  const collections = await database.addCollections({
    palaces: { schema: palaceSchema },
    folders: { schema: folderSchema },
    rooms: { schema: roomSchema },
    loci: { schema: locusSchema },
  })
  return {
    palaces: collections.palaces,
    folders: collections.folders,
    rooms: collections.rooms,
    loci: collections.loci,
  }
}
