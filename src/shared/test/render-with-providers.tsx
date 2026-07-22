import type { ReactElement, ReactNode } from 'react'
import { render, type RenderOptions, type RenderResult } from '@testing-library/react'
import { MotionConfig } from 'motion/react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'

interface ProviderOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Default 'always' so entrance/exit animations never gate assertions. */
  reducedMotion?: 'always' | 'never' | 'user'
}

export function renderWithProviders(
  ui: ReactElement,
  { reducedMotion = 'always', ...options }: ProviderOptions = {},
): RenderResult {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <I18nextProvider i18n={i18n}>
        <MotionConfig reducedMotion={reducedMotion}>{children}</MotionConfig>
      </I18nextProvider>
    )
  }
  return render(ui, { wrapper: Wrapper, ...options })
}
