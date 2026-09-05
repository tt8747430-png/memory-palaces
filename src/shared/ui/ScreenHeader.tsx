import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { IconButton } from '@/shared/ui/primitives'
import { HeaderBar } from './HeaderBar'

/**
 * A back control and its name arrive together or not at all. `backLabel` used to be optional with
 * a literal 'Back' behind it — which all 33 callers already overrode with a translation, so the
 * default was doing nothing but waiting to ship untranslated English to the 34th.
 */
type BackProps =
  | { onBack: (() => void) | undefined; backLabel: string }
  | { onBack?: undefined; backLabel?: undefined }

export type ScreenHeaderProps = {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  className?: string
} & BackProps

export function ScreenHeader(props: ScreenHeaderProps) {
  const { title, subtitle, action, className } = props
  return (
    <HeaderBar className={className}>
      {props.onBack ? (
        <IconButton variant="glass" aria-label={props.backLabel} onClick={props.onBack}>
          <ChevronLeft className="size-5" aria-hidden />
        </IconButton>
      ) : null}
      <div className={props.onBack ? 'min-w-0 flex-1 pl-1' : 'min-w-0 flex-1 pl-3'}>
        <h1 className="truncate">{title}</h1>
        {subtitle ? <p className="truncate text-label text-muted-foreground">{subtitle}</p> : null}
      </div>
      {action}
    </HeaderBar>
  )
}
