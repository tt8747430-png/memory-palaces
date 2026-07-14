import { shuffle } from '@/shared/lib'

export interface Tile {
  id: string
  cardId: string
  kind: 'term' | 'def'
  text: string
}

export interface MatchCard {
  id: string
  front: string
  back: string
}

export interface MatchState {
  tiles: Tile[]
  selected: string[]
  matched: string[]
  wrong: string[]
  moves: number
  status: 'playing' | 'won'
}

export type MatchAction =
  | { type: 'pick'; tileId: string }
  | { type: 'clearWrong' }
  | { type: 'reset'; tiles: Tile[] }

export const MAX_PAIRS = 6

export function buildTiles(cards: MatchCard[], random: () => number = Math.random): Tile[] {
  const chosen = shuffle(cards, random).slice(0, Math.min(MAX_PAIRS, cards.length))
  const tiles = chosen.flatMap((card): Tile[] => [
    { id: `${card.id}-t`, cardId: card.id, kind: 'term', text: card.front },
    { id: `${card.id}-d`, cardId: card.id, kind: 'def', text: card.back },
  ])
  return shuffle(tiles, random)
}

export function initMatch(tiles: Tile[]): MatchState {
  return {
    tiles,
    selected: [],
    matched: [],
    wrong: [],
    moves: 0,
    status: tiles.length === 0 ? 'won' : 'playing',
  }
}

function isPair(a: Tile | undefined, b: Tile | undefined): boolean {
  return Boolean(a && b && a.cardId === b.cardId && a.kind !== b.kind)
}

export function matchReducer(state: MatchState, action: MatchAction): MatchState {
  switch (action.type) {
    case 'pick': {
      if (state.status === 'won' || state.wrong.length > 0) return state
      if (state.matched.includes(action.tileId)) return state
      if (state.selected.includes(action.tileId)) {
        return { ...state, selected: state.selected.filter((id) => id !== action.tileId) }
      }
      const selected = [...state.selected, action.tileId]
      if (selected.length < 2) {
        return { ...state, selected }
      }
      const moves = state.moves + 1
      const byId = new Map(state.tiles.map((tile) => [tile.id, tile]))
      if (isPair(byId.get(selected[0]!), byId.get(selected[1]!))) {
        const matched = [...state.matched, selected[0]!, selected[1]!]
        const status = matched.length === state.tiles.length ? 'won' : 'playing'
        return { ...state, matched, selected: [], moves, status }
      }
      return { ...state, selected, wrong: selected, moves }
    }

    case 'clearWrong':
      return { ...state, wrong: [], selected: [] }

    case 'reset':
      return initMatch(action.tiles)

    default:
      return state
  }
}

export function remainingPairs(state: MatchState): number {
  return (state.tiles.length - state.matched.length) / 2
}
