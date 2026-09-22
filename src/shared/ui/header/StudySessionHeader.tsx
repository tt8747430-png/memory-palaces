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
  backIcon?: ReactNode
  progress?: HeaderProgress
  action?: ReactNode
}

/**
 * A study session's bar. It paints nothing: the Card style's scene runs under it — and on up
 * under the clock (ADR 0006) — as it already runs under the footer, so the session is one surface
 * from the top of the screen to the bottom. It is the same height as every other bar; the progress
 * track floats on its bottom edge rather than adding a row.
 */
export function StudySessionHeader({
  title,
  subtitle,
  backLabel,
  onBack,
  backIcon,
  progress,
  action,
}: StudySessionHeaderProps) {
  return (
    <Header
      className="relative shrink-0"
      title={title}
      subtitle={subtitle}
      progress={progress}
      onBack={onBack}
      backLabel={backLabel}
    >
      <HeaderBar>
        <HeaderBack>{backIcon ?? <X className="size-5" aria-hidden />}</HeaderBack>
        {progress ? (
          <div className="flex min-w-0 flex-1 justify-center">
            {/* The count takes the bar, but the screen keeps its name for whoever cannot see it. */}
            <HeaderTitle className="sr-only" />
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
      {progress ? <HeaderTrack className="absolute inset-x-4 bottom-0" /> : null}
    </Header>
  )
}
