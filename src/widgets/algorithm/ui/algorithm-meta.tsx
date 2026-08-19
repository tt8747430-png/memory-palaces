import type { ReactNode } from 'react'
import { Layers, RefreshCw } from 'lucide-react'
import type { LearningAlgorithm } from '@/entities/deck'

export interface AlgorithmMeta {
  icon: ReactNode
  nameKey: string
  longNameKey: string
  bodyKey: string
}

/**
 * One description of each algorithm, shared by the picker, the settings rows and deck detail — so
 * the deck's face and the sheet that changes it can never name the same choice differently.
 */
export const ALGORITHM_META: Record<LearningAlgorithm, AlgorithmMeta> = {
  fast: {
    icon: <Layers className="size-5 text-accent" aria-hidden />,
    nameKey: 'algorithm.fast.name',
    longNameKey: 'algorithm.fast.name',
    bodyKey: 'algorithm.fast.body',
  },
  spaced: {
    icon: (
      <span className="relative grid size-5 place-items-center" aria-hidden>
        <Layers className="size-5 text-accent" />
        <RefreshCw className="absolute -right-1 -bottom-1 size-3 text-accent" strokeWidth={2.5} />
      </span>
    ),
    nameKey: 'algorithm.spaced.name',
    longNameKey: 'algorithm.spaced.longName',
    bodyKey: 'algorithm.spaced.body',
  },
}
