import { type ComponentType, useEffect } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { House, User } from 'lucide-react'
import { type RoutePath, ROUTES } from '@/shared/config/routes'
import { cn } from '@/shared/lib'

interface Tab {
  to: typeof ROUTES.home | typeof ROUTES.profile
  Icon: ComponentType<{ className?: string }>
  labelKey: 'nav.home' | 'nav.profile'
}

const TABS: Tab[] = [
  { to: ROUTES.home, Icon: House, labelKey: 'nav.home' },
  { to: ROUTES.profile, Icon: User, labelKey: 'nav.profile' },
]

const TAB_PATHS = TABS.map((tab) => tab.to) as RoutePath[]

const navySpring = { type: 'spring', stiffness: 500, damping: 40, mass: 0.6 } as const

export function AppNav() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const showNav = TAB_PATHS.includes(pathname as RoutePath)

  // Publish the space the tab bar occupies so bottom-docked overlays (the select
  // toolbar) can clear it instead of stacking on top. Present only while the nav is.
  useEffect(() => {
    if (!showNav) return
    const root = document.documentElement
    root.style.setProperty(
      '--app-tab-inset',
      'calc(max(0.75rem, env(safe-area-inset-bottom)) + 4rem)',
    )
    return () => {
      root.style.removeProperty('--app-tab-inset')
    }
  }, [showNav])

  if (!showNav) return null

  return (
    <nav
      aria-label={t('nav.label')}
      className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-[200] -translate-x-1/2"
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 scale-110 opacity-60 blur-2xl"
        style={{
          background:
            'linear-gradient(to top, color-mix(in srgb, var(--primary) 26%, transparent), color-mix(in srgb, var(--accent) 12%, transparent), transparent)',
        }}
      />

      <div className="relative flex h-16 w-64 items-center justify-around overflow-hidden rounded-nav px-4 shadow-elevated">
        <div
          aria-hidden
          className="absolute inset-0 backdrop-blur-2xl"
          style={{
            background:
              'linear-gradient(135deg, color-mix(in srgb, var(--primary) 62%, transparent), color-mix(in srgb, var(--primary) 50%, transparent))',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-nav bg-gradient-to-b from-white/15 to-transparent"
        />

        {TABS.map(({ to, Icon, labelKey }) => {
          const isActive = pathname === to
          return (
            <motion.button
              key={to}
              type="button"
              onClick={() => void navigate({ to })}
              aria-current={isActive ? 'page' : undefined}
              whileTap={{ scale: 0.92 }}
              className="relative flex h-full min-w-[72px] items-center justify-center"
            >
              {isActive ? (
                <motion.span
                  layoutId="navPill"
                  transition={navySpring}
                  aria-hidden
                  className="absolute size-12 rounded-[20px] bg-white shadow-[inset_0_2px_8px_rgba(0,0,0,0.12),inset_0_-2px_6px_rgba(255,255,255,0.25)]"
                />
              ) : null}
              <span className="relative z-10 flex flex-col items-center gap-1">
                <Icon className={cn('size-6', isActive ? 'text-primary' : 'text-white')} />
                <span
                  className={cn(
                    'text-[length:var(--p-text-tiny)] font-medium',
                    isActive ? 'text-primary' : 'text-white/75',
                  )}
                >
                  {t(labelKey)}
                </span>
              </span>
            </motion.button>
          )
        })}
      </div>
    </nav>
  )
}
