/**
 * The one vocabulary of row actions. Swipe rows and the select toolbar both
 * draw from it, so an action has a single label, accent and icon wherever it
 * appears; each surface only decides *which* of them it offers.
 */
export type ActionId =
  | 'favorite'
  | 'move'
  | 'archive'
  | 'unfile'
  | 'settings'
  | 'edit'
  | 'addSubdeck'
  | 'addDeck'
  | 'duplicate'
  | 'reset'
  | 'flag'
  | 'known'
  | 'delete'

export type ActionAccent =
  | 'rose'
  | 'plum'
  | 'violet'
  | 'indigo'
  | 'blue'
  | 'teal'
  | 'emerald'
  | 'gold'
  | 'red'
  | 'slate'

export const ACTION_ACCENT: Record<ActionAccent, { fill: string; ink: 'light' | 'dark' }> = {
  rose: { fill: 'var(--sw-rose)', ink: 'light' },
  plum: { fill: 'var(--sw-plum)', ink: 'light' },
  violet: { fill: 'var(--sw-violet)', ink: 'light' },
  indigo: { fill: 'var(--sw-indigo)', ink: 'light' },
  blue: { fill: 'var(--sw-blue)', ink: 'light' },
  teal: { fill: 'var(--sw-teal)', ink: 'light' },
  emerald: { fill: 'var(--sw-emerald)', ink: 'light' },
  gold: { fill: 'var(--sw-gold)', ink: 'dark' },
  red: { fill: 'var(--sw-red)', ink: 'light' },
  slate: { fill: 'var(--sw-slate)', ink: 'light' },
}

export interface ActionMeta {
  id: ActionId
  labelKey: string
  accent: ActionAccent
  destructive?: boolean
}

export const ACTION_META: Record<ActionId, ActionMeta> = {
  favorite: { id: 'favorite', labelKey: 'actions.favorite', accent: 'rose' },
  move: { id: 'move', labelKey: 'actions.move', accent: 'indigo' },
  archive: { id: 'archive', labelKey: 'actions.archive', accent: 'teal' },
  unfile: { id: 'unfile', labelKey: 'actions.unfile', accent: 'blue' },
  settings: { id: 'settings', labelKey: 'actions.settings', accent: 'slate' },
  edit: { id: 'edit', labelKey: 'actions.edit', accent: 'blue' },
  addSubdeck: { id: 'addSubdeck', labelKey: 'actions.addSubdeck', accent: 'emerald' },
  addDeck: { id: 'addDeck', labelKey: 'actions.addDeck', accent: 'emerald' },
  duplicate: { id: 'duplicate', labelKey: 'actions.duplicate', accent: 'violet' },
  reset: { id: 'reset', labelKey: 'actions.reset', accent: 'plum' },
  flag: { id: 'flag', labelKey: 'actions.flag', accent: 'gold' },
  known: { id: 'known', labelKey: 'actions.known', accent: 'emerald' },
  delete: { id: 'delete', labelKey: 'actions.delete', accent: 'red', destructive: true },
}

export const accentStyleOf = (id: ActionId) => ACTION_ACCENT[ACTION_META[id].accent]
