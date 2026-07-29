/**
 * The one rounded status pill — a count, an outcome, a toggle. Screens spell
 * only the tone; the shape, type scale and weight are decided here so a pill
 * reads the same whether it sits on a card, a session overlay or a sheet.
 */
export type PillTone = 'info' | 'success' | 'warning' | 'primary'

const PILL_SHAPE =
  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 ' +
  'text-(length:--p-text-label) font-semibold'

const PILL_TONE: Record<PillTone, string> = {
  info: 'bg-info-surface text-info-foreground',
  success: 'bg-(--success-surface) text-(--success-on-surface)',
  warning: 'bg-(--warning-surface) text-(--warning-foreground)',
  primary: 'bg-primary text-primary-foreground',
}

export const pillSurface = (tone: PillTone): string => `${PILL_SHAPE} ${PILL_TONE[tone]}`
