import type { ReactNode } from 'react'
import { createContext, use } from 'react'

/**
 * How far through a study session the learner is. `total: 0` reads as "nothing to do yet" rather
 * than a division by zero — `HeaderState.fraction` is where that is settled, once.
 */
export interface HeaderProgress {
  done: number
  total: number
}

/** What a screen says its bar is about. */
export interface HeaderSubject {
  title?: ReactNode
  subtitle?: ReactNode
  progress?: HeaderProgress
}

/** That, plus what the frame derives from it before any part reads it. */
export interface HeaderState extends HeaderSubject {
  /** `progress` as 0…1, derived once so the count and the track can never disagree. */
  fraction: number
}

/**
 * A way back and the name that announces it, as one value. Split across two fields they could be
 * half-supplied, and every part reading either would have to re-check both.
 */
export interface HeaderBackAction {
  go: () => void
  label: string
}

export interface HeaderHandlers {
  /** Absent on a root screen — `HeaderBack` then draws nothing rather than a dead control. */
  back?: HeaderBackAction
}

/**
 * The contract every header part is written against. A screen supplies it by rendering `Header`;
 * anything inside — a part shipped here, or a one-off a single screen needs — reads it with
 * `useHeader()` and works in any bar without knowing which one it landed in.
 */
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

/**
 * A back control and its name arrive together or not at all. `backLabel` used to be optional with
 * a literal 'Back' behind it — which all 33 callers already overrode with a translation, so the
 * default was doing nothing but waiting to ship untranslated English to the 34th.
 */
export type HeaderBackProps =
  | { onBack: (() => void) | undefined; backLabel: string }
  | { onBack?: undefined; backLabel?: undefined }

/** Passes the pair on with the pairing intact, and no cast to do it. */
export function backProps(props: HeaderBackProps): HeaderBackProps {
  return props.backLabel === undefined ? {} : { onBack: props.onBack, backLabel: props.backLabel }
}
