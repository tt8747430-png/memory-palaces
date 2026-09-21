import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { makeFaceProps } from './face-fixtures'
import { PromptFace } from './PromptFace'

afterEach(cleanup)

describe('PromptFace', () => {
  it('renders the prompt', () => {
    renderWithProviders(<PromptFace {...makeFaceProps({ prompt: 'Capital of France?' })} />)
    expect(screen.getByRole('heading', { name: 'Capital of France?' })).toBeInTheDocument()
  })

  it('carries no reveal control of its own — the footer owns that, in every mode', () => {
    renderWithProviders(<PromptFace {...makeFaceProps({})} />)
    expect(screen.queryByRole('button', { name: 'Show answer' })).toBeNull()
  })
})
