import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * `tailwind-merge` resolves conflicts by matching a class against Tailwind's *own* scales. Every
 * size, radius and elevation in this app is a name Tailwind never shipped, so out of the box the
 * merge guessed: `text-label` looked like a text *colour* (the colour group's matcher accepts any
 * word), `rounded-card` looked like nothing and conflicted with nothing. A single `cn()` holding a
 * size and a colour therefore lost the size — every field label, every sheet title, every header
 * subtitle in the app rendered at whatever it inherited.
 *
 * So the theme is declared here, once. `theme` extends the scales `@theme` in `theme.css` adds to;
 * `classGroups` covers the four inset paddings hand-written in that file's `@layer utilities`,
 * which are padding and must therefore beat — and be beaten by — a numeric `pb-*`.
 *
 * Adding a name to `theme.css` means adding it here. `cn.test.ts` is the list restated as
 * behaviour.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        'tiny',
        'label',
        'body',
        'title',
        'headline',
        'entry',
        'glyph-sm',
        'glyph-md',
        'glyph-lg',
        'glyph-xl',
        'glyph-2xl',
        'glyph-3xl',
        'figure-sm',
        'figure-md',
        'figure-lg',
        'figure-xl',
        'card-prompt',
        'card-title',
        'card-answer',
        'card-token',
        'card-line',
        'card-preview',
        'card-preview-back',
      ],
      radius: [
        'hairline',
        'swatch',
        'mark',
        'field',
        'control',
        'tile',
        'tile-slot',
        'card',
        'squircle',
        'card-featured',
        'nav',
      ],
      shadow: ['rest', 'featured', 'interactive', 'elevated', 'card'],
    },
    classGroups: {
      pb: ['pb-safe', 'pb-keyboard', 'pb-safe-keyboard'],
      pt: ['pt-safe'],
    },
  },
})

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
