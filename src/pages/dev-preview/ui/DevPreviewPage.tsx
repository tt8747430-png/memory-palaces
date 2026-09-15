import { useEffect, useRef, useState } from 'react'
import { cn } from '@/shared/lib'
import {
  AppHeader,
  AppScreen,
  HeaderBack,
  HeaderBar,
  HeaderSubtitle,
  HeaderTitle,
  SegmentedControl,
} from '@/shared/ui'
import { KeyboardSection } from './kitchen-sink/KeyboardSection'
import { OverlaysSection } from './kitchen-sink/OverlaysSection'
import { ColourSection } from './kitchen-sink/ColourSection'
import { SwipeSection } from './kitchen-sink/SwipeSection'
import { ButtonsSection } from './kitchen-sink/ButtonsSection'
import { InputsSection } from './kitchen-sink/InputsSection'
import { TogglesSection } from './kitchen-sink/TogglesSection'
import { FeedbackSection } from './kitchen-sink/FeedbackSection'
import { DataSection } from './kitchen-sink/DataSection'

const THEME_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
] as const
type ThemeMode = (typeof THEME_OPTIONS)[number]['value']

const SECTIONS = [
  { id: 'keyboard', label: 'Keyboard' },
  { id: 'overlays', label: 'Overlays' },
  { id: 'colour', label: 'Colour row' },
  { id: 'gestures', label: 'Swipe' },
  { id: 'buttons', label: 'Buttons' },
  { id: 'inputs', label: 'Inputs' },
  { id: 'toggles', label: 'Toggles' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'data', label: 'Data' },
] as const

export function DevPreviewPage({ onBack }: { onBack?: () => void }) {
  const [theme, setTheme] = useState<ThemeMode>('system')
  const [scrollNode, setScrollNode] = useState<HTMLElement | null>(null)
  const [activeId, setActiveId] = useState<string>(SECTIONS[0]?.id ?? '')

  const originalTheme = useRef<string | undefined>(undefined)
  useEffect(() => {
    originalTheme.current = document.documentElement.dataset.theme
    return () => {
      if (originalTheme.current) document.documentElement.dataset.theme = originalTheme.current
    }
  }, [])
  useEffect(() => {
    const root = document.documentElement
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      root.dataset.theme = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme
    }
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme])

  useEffect(() => {
    if (!scrollNode) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActiveId(entry.target.id)
      },
      { root: scrollNode, rootMargin: '0px 0px -70% 0px', threshold: 0 },
    )
    for (const section of SECTIONS) {
      const element = document.getElementById(section.id)
      if (element) observer.observe(element)
    }
    return () => observer.disconnect()
  }, [scrollNode])

  const jumpTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <AppScreen
      gutter="end"
      scrollRef={setScrollNode}
      header={
        <AppHeader
          onBack={onBack}
          backLabel="Back"
          title="Kitchen sink"
          subtitle="Component states — dev only · CODE_STYLE.md §11"
        >
          <div className="mx-auto w-full max-w-app px-5">
            <HeaderBar layout="study" className="items-start gap-3">
              <HeaderBack className="shrink-0" />
              <div className="flex min-w-0 flex-1 flex-col">
                <HeaderTitle className="text-title font-bold" />
                <HeaderSubtitle className="text-muted-foreground" />
              </div>
              <SegmentedControl
                aria-label="Preview theme"
                size="sm"
                value={theme}
                onChange={setTheme}
                options={THEME_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
                className="w-45 shrink-0"
              />
            </HeaderBar>
            <nav
              aria-label="Sections"
              className="-mx-1.5 mt-3 flex gap-2 overflow-x-auto p-1.5 scrollbar-hide"
            >
              {SECTIONS.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => jumpTo(section.id)}
                  aria-current={activeId === section.id}
                  className={cn(
                    'shrink-0 rounded-full px-3 py-1.5 text-label font-medium transition-colors',
                    activeId === section.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-info-surface text-info-foreground',
                  )}
                >
                  {section.label}
                </button>
              ))}
            </nav>
          </div>
        </AppHeader>
      }
    >
      <div className="flex flex-col gap-8 pt-4">
        <KeyboardSection />
        <OverlaysSection />
        <ColourSection />
        <SwipeSection />
        <ButtonsSection />
        <InputsSection />
        <TogglesSection />
        <FeedbackSection />
        <DataSection />
      </div>
    </AppScreen>
  )
}
