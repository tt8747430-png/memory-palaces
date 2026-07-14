import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'

/**
 * PrimeNG design tokens → app semantic tokens (ADR-0001/0002).
 *
 * Light and dark point at the same `var(--…)` references on purpose: the
 * semantic tokens themselves flip on `[data-theme='dark']` (tokens.css), and
 * `darkModeSelector` in app.config.ts targets the same attribute, so PrimeNG's
 * scheme-dependent internals stay in sync with everything else.
 */
const scheme = {
  primary: {
    color: 'var(--primary)',
    contrastColor: 'var(--primary-foreground)',
    hoverColor: 'var(--primary)',
    activeColor: 'var(--primary)',
  },
  content: {
    background: 'var(--surface)',
    hoverBackground: 'var(--surface-sky)',
    borderColor: 'var(--border)',
    color: 'var(--text-primary)',
    hoverColor: 'var(--text-heading)',
  },
  overlay: {
    select: {
      background: 'var(--surface)',
      borderColor: 'var(--border)',
      color: 'var(--text-primary)',
    },
    popover: {
      background: 'var(--surface)',
      borderColor: 'var(--border)',
      color: 'var(--text-primary)',
    },
    modal: {
      background: 'var(--surface)',
      borderColor: 'var(--border)',
      color: 'var(--text-primary)',
    },
  },
  text: {
    color: 'var(--text-primary)',
    hoverColor: 'var(--text-heading)',
    mutedColor: 'var(--text-muted)',
    hoverMutedColor: 'var(--text-secondary)',
  },
}

export const MindscapePreset = definePreset(Aura, {
  primitive: {
    borderRadius: {
      none: '0',
      xs: '8px',
      sm: 'var(--ms-radius-sm)',
      md: 'var(--ms-radius-md)',
      lg: 'var(--ms-radius-lg)',
      xl: 'var(--ms-radius-xl)',
    },
  },
  semantic: {
    colorScheme: {
      light: scheme,
      dark: scheme,
    },
  },
})
