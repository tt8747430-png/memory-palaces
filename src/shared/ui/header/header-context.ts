import type { ReactNode } from 'react'
import { createContext, use } from 'react'

export interface HeaderProgress {
  done: number
  total: number
}

export interface HeaderSubject {
  title?: ReactNode
  subtitle?: ReactNode
  progress?: HeaderProgress
}

export interface HeaderState extends HeaderSubject {
  fraction: number
}

export interface HeaderBackAction {
  go: () => void
  label: string
}

export interface HeaderHandlers {
  back?: HeaderBackAction
}

export interface HeaderContextValue {
  state: HeaderState
  actions: HeaderHandlers
}

export const HeaderContext = createContext<HeaderContextValue | null>(null)

export function useHeader(): HeaderContextValue {
  const value = use(HeaderContext)
  if (!value) throw new Error('A header part was rendered outside <Header>.')
  return value
}

export type HeaderBackProps =
  | { onBack: (() => void) | undefined; backLabel: string }
  | { onBack?: undefined; backLabel?: undefined }

export function backProps(props: HeaderBackProps): HeaderBackProps {
  return props.backLabel === undefined ? {} : { onBack: props.onBack, backLabel: props.backLabel }
}
