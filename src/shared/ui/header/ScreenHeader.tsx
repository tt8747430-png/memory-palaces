import type { ReactNode } from 'react'
import { AppHeader } from './AppHeader'
import { HeaderBack, HeaderBar, HeaderHeading, HeaderSubtitle, HeaderTitle } from './Header'
import { backProps, type HeaderBackProps } from './header-context'

export type ScreenHeaderProps = {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  className?: string
} & HeaderBackProps

/**
 * The bar every ordinary screen wears: a back chevron, a name aligned with the content under it,
 * and room for one control on the trailing side.
 */
export function ScreenHeader(props: ScreenHeaderProps) {
  const { title, subtitle, action, className } = props
  return (
    <AppHeader {...backProps(props)} title={title} subtitle={subtitle}>
      <HeaderBar className={className}>
        <HeaderBack />
        <HeaderHeading>
          <HeaderTitle />
          <HeaderSubtitle className="text-muted-foreground" />
        </HeaderHeading>
        {action}
      </HeaderBar>
    </AppHeader>
  )
}
