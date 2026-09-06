import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import {
  Header,
  HeaderBack,
  HeaderBar,
  HeaderCount,
  HeaderSpacer,
  HeaderSubtitle,
  HeaderTitle,
  HeaderTrack,
} from './Header'
import type { HeaderProgress } from './header-context'

export interface StudySessionHeaderProps {
  title: string
  subtitle?: string
  backLabel: string
  onBack: () => void
  /** Defaults to a close cross; pass a chevron where back means "up a level". */
  backIcon?: ReactNode
  /**
   * How far through the pass the learner is. Given, it replaces the title block with a count pill
   * and draws a track under the bar — a deck's name matters less than how much of it is left.
   */
  progress?: HeaderProgress
  /** Trailing control(s). A spacer keeps the title centred when there are none. */
  action?: ReactNode
  /** A chip row — whatever sits under the bar, inside its gutter. */
  children?: ReactNode
}

/**
 * The bar a study session wears — a pass through a deck, a quiz, a match. The same frame as every
 * other header, bare so the card scene behind it keeps painting the bar, and centred on the thing
 * the learner is watching rather than left-aligned on a name.
 */
export function StudySessionHeader({
  title,
  subtitle,
  backLabel,
  onBack,
  backIcon,
  progress,
  action,
  children,
}: StudySessionHeaderProps) {
  return (
    <Header
      className="px-5"
      title={title}
      subtitle={subtitle}
      progress={progress}
      onBack={onBack}
      backLabel={backLabel}
    >
      <HeaderBar layout="study">
        <HeaderBack>{backIcon ?? <X className="size-5" aria-hidden />}</HeaderBack>
        {progress ? (
          <div className="flex min-w-0 flex-1 justify-center">
            <HeaderCount />
          </div>
        ) : (
          <div className="min-w-0 flex-1 text-center">
            <HeaderTitle className="text-title font-semibold text-heading" />
            <HeaderSubtitle />
          </div>
        )}
        {action ?? <HeaderSpacer />}
      </HeaderBar>
      {progress ? <HeaderTrack className="mt-2" /> : null}
      {children}
    </Header>
  )
}
