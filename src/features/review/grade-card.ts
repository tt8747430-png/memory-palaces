import { schedule, type Grade } from '@/shared/lib'
import type { Locus, LocusStore } from '@/entities/locus'

/**
 * Command — grade a card in a review session: apply the SM-2 schedule for the
 * grade to the locus and persist it. The single write-path for spaced repetition
 * (the UI now, the AI Tutor later). `now` is injected so scheduling stays
 * deterministic; `updatedAt` rides the same clock for sync correctness later.
 */
export async function gradeCard(
  store: LocusStore,
  locusId: string,
  grade: Grade,
  now: number = Date.now(),
): Promise<Locus> {
  const existing = store.getState().loci.find((locus) => locus.id === locusId)
  if (!existing) throw new Error(`Locus not found: ${locusId}`)
  const updated: Locus = {
    ...existing,
    srs: schedule(existing.srs, grade, now),
    updatedAt: new Date(now).toISOString(),
  }
  await store.getState().save(updated)
  return updated
}
