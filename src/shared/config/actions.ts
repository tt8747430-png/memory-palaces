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
  | 'style'
  | 'sortSubdecks'
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

/**
 * A fill and the ink that reads on it, both as CSS values. Resolved here rather than named `light`
 * or `dark`, so that no surface drawing an accent has to branch — and so no component reaches for
 * a primitive token to spell the dark one (CODE_STYLE §5).
 */
export interface AccentStyle {
  fill: string
  ink: string
}

const ON_FILL_LIGHT = 'var(--sw-ink-light)'
const ON_FILL_DARK = 'var(--sw-ink-dark)'

export const ACTION_ACCENT: Record<ActionAccent, AccentStyle> = {
  rose: { fill: 'var(--sw-rose)', ink: ON_FILL_LIGHT },
  plum: { fill: 'var(--sw-plum)', ink: ON_FILL_LIGHT },
  violet: { fill: 'var(--sw-violet)', ink: ON_FILL_LIGHT },
  indigo: { fill: 'var(--sw-indigo)', ink: ON_FILL_LIGHT },
  blue: { fill: 'var(--sw-blue)', ink: ON_FILL_LIGHT },
  cyan: { fill: 'var(--sw-cyan)', ink: ON_FILL_LIGHT },
  teal: { fill: 'var(--sw-teal)', ink: ON_FILL_LIGHT },
  emerald: { fill: 'var(--sw-emerald)', ink: ON_FILL_LIGHT },
  gold: { fill: 'var(--sw-gold)', ink: ON_FILL_DARK },
  amber: { fill: 'var(--sw-amber)', ink: ON_FILL_DARK },
  red: { fill: 'var(--sw-red)', ink: ON_FILL_LIGHT },
  slate: { fill: 'var(--sw-slate)', ink: ON_FILL_LIGHT },
  stone: { fill: 'var(--sw-stone)', ink: ON_FILL_LIGHT },
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
  style: { id: 'style', labelKey: 'actions.style', accent: 'plum' },
  sortSubdecks: { id: 'sortSubdecks', labelKey: 'actions.sortSubdecks', accent: 'cyan' },
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
