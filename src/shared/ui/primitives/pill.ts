export type PillTone = 'info' | 'success' | 'warning' | 'danger' | 'primary'

const PILL_SHAPE =
  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-label font-semibold'

const PILL_TONE: Record<PillTone, string> = {
  info: 'bg-info-surface text-info-foreground',
  success: 'bg-(--success-surface) text-(--success-on-surface)',
  warning: 'bg-(--warning-surface) text-(--warning-foreground)',
  danger: 'bg-(--danger-surface) text-(--danger-on-surface)',
  primary: 'bg-primary text-primary-foreground',
}

export const pillSurface = (tone: PillTone): string => `${PILL_SHAPE} ${PILL_TONE[tone]}`
