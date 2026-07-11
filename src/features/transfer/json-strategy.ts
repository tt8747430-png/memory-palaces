import type { CardDraft, TransferStrategy } from './model'

function toDraft(value: unknown): CardDraft {
  if (typeof value !== 'object' || value === null) throw new Error('Each card must be an object')
  const record = value as Record<string, unknown>
  if (typeof record.front !== 'string' || typeof record.back !== 'string') {
    throw new Error('Each card needs string front and back')
  }
  return {
    front: record.front,
    back: record.back,
    hint: typeof record.hint === 'string' ? record.hint : undefined,
    tip: typeof record.tip === 'string' ? record.tip : undefined,
  }
}

/** Lossless JSON format — carries the full card shape (front/back/hint/tip). */
export const jsonStrategy: TransferStrategy = {
  id: 'json',
  serialize: (cards) => JSON.stringify(cards, null, 2),
  parse: (text) => {
    const data: unknown = JSON.parse(text)
    if (!Array.isArray(data)) throw new Error('Expected a JSON array of cards')
    return data.map(toDraft)
  },
}
