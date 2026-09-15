import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

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
