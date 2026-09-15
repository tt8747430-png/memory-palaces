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
  | 'select'
  | 'grade'
  | 'studyFrom'
  | 'freeze'
  | 'reverse'
  | 'history'
  | 'delete'

export type ActionAccent =
  | 'rose'
  | 'plum'
  | 'violet'
  | 'indigo'
  | 'blue'
  | 'cyan'
  | 'teal'
  | 'emerald'
  | 'gold'
  | 'amber'
  | 'red'
  | 'slate'
  | 'stone'

export const ACTION_ACCENT: Record<ActionAccent, { fill: string; ink: 'light' | 'dark' }> = {
  rose: { fill: 'var(--sw-rose)', ink: 'light' },
  plum: { fill: 'var(--sw-plum)', ink: 'light' },
  violet: { fill: 'var(--sw-violet)', ink: 'light' },
  indigo: { fill: 'var(--sw-indigo)', ink: 'light' },
  blue: { fill: 'var(--sw-blue)', ink: 'light' },
  cyan: { fill: 'var(--sw-cyan)', ink: 'light' },
  teal: { fill: 'var(--sw-teal)', ink: 'light' },
  emerald: { fill: 'var(--sw-emerald)', ink: 'light' },
  gold: { fill: 'var(--sw-gold)', ink: 'dark' },
  amber: { fill: 'var(--sw-amber)', ink: 'dark' },
  red: { fill: 'var(--sw-red)', ink: 'light' },
  slate: { fill: 'var(--sw-slate)', ink: 'light' },
  stone: { fill: 'var(--sw-stone)', ink: 'light' },
}

export interface ActionMeta {
  id: ActionId
  labelKey: string
  menuLabelKey?: string
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
  reset: {
    id: 'reset',
    labelKey: 'actions.reset',
    menuLabelKey: 'actions.resetMenu',
    accent: 'plum',
  },
  flag: { id: 'flag', labelKey: 'actions.flag', accent: 'gold' },
  known: {
    id: 'known',
    labelKey: 'actions.known',
    menuLabelKey: 'actions.knownMenu',
    accent: 'emerald',
  },
  select: { id: 'select', labelKey: 'actions.select', accent: 'stone' },
  grade: {
    id: 'grade',
    labelKey: 'actions.grade',
    menuLabelKey: 'actions.gradeMenu',
    accent: 'amber',
  },
  studyFrom: {
    id: 'studyFrom',
    labelKey: 'actions.studyFrom',
    menuLabelKey: 'actions.studyFromMenu',
    accent: 'rose',
  },
  freeze: { id: 'freeze', labelKey: 'actions.freeze', accent: 'cyan' },
  reverse: { id: 'reverse', labelKey: 'actions.reverse', accent: 'teal' },
  history: {
    id: 'history',
    labelKey: 'actions.history',
    menuLabelKey: 'actions.historyMenu',
    accent: 'slate',
  },
  delete: { id: 'delete', labelKey: 'actions.delete', accent: 'red', destructive: true },
}

/**
 * Every action a single card offers, in the order the card menu lists them. The
 * swipe rails draw from this same list — nothing is menu-only or swipe-only.
 */
export const CARD_ACTIONS: readonly ActionId[] = [
  'select',
  'edit',
  'grade',
  'studyFrom',
  'flag',
  'known',
  'reset',
  'freeze',
  'reverse',
  'move',
  'duplicate',
  'history',
  'delete',
]

export const actionLabelKey = (id: ActionId, surface: 'chip' | 'menu'): string => {
  const meta = ACTION_META[id]
  return surface === 'menu' ? (meta.menuLabelKey ?? meta.labelKey) : meta.labelKey
}

export const accentStyleOf = (id: ActionId) => ACTION_ACCENT[ACTION_META[id].accent]
