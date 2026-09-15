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
  children?: ReactNode
}

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
