import { makePalace, type MakePalaceInput, type Palace, type PalaceStore } from '@/entities/palace'

/** Everything {@link makePalace} needs except the generated identity + timestamp. */
export type CreatePalaceInput = Omit<MakePalaceInput, 'id' | 'createdAt'>

/**
 * Command — create a palace. The single write-path used by the UI and (later) the
 * AI Tutor. Id + clock are generated here (the side-effect layer); the entity
 * factory enforces the invariants.
 */
export async function createPalace(store: PalaceStore, input: CreatePalaceInput): Promise<Palace> {
  const palace = makePalace({
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  })
  await store.getState().save(palace)
  return palace
}
