import type { ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronRight, Lock } from 'lucide-react'
import type { LearningAlgorithm } from '@/entities/deck'
import { cn } from '@/shared/lib'
import { ALGORITHM_META } from './algorithm-meta'

const VARIANT = {
  open: { Trailing: ChevronRight, tile: '' },
  locked: { Trailing: Lock, tile: 'opacity-60' },
} as const

export interface AlgorithmCardFrameProps extends Omit<
  ComponentProps<'button'>,
  'children' | 'className'
> {
  algorithm: LearningAlgorithm
  hint: string
  variant: keyof typeof VARIANT
}

export function AlgorithmCardFrame({
  algorithm,
  hint,
  variant,
  ...button
}: AlgorithmCardFrameProps) {
  const { t } = useTranslation()
  const meta = ALGORITHM_META[algorithm]
  const { Trailing, tile } = VARIANT[variant]
  return (
    <button
      type="button"
      {...button}
      className="flex items-center gap-3.5 rounded-card bg-card p-4 text-left shadow-rest transition-[transform,background-color] hover:bg-info-surface active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
    >
      <span
        className={cn(
          'grid size-12 shrink-0 place-items-center rounded-card bg-info-surface',
          tile,
        )}
      >
        {meta.icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-title font-bold tracking-tight text-heading">
          {t(meta.nameKey as never)}
        </span>
        <span className="mt-0.5 block text-label text-muted-foreground">{hint}</span>
      </span>
      <Trailing className="size-5 shrink-0 text-muted-foreground" aria-hidden />
    </button>
  )
}
