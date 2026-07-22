import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { CardFields, QuestionFields } from './editor-fields'

afterEach(cleanup)

function cardFieldsProps(overrides: Partial<Parameters<typeof CardFields>[0]> = {}) {
  return {
    front: '',
    back: '',
    hint: '',
    tip: '',
    onFront: vi.fn(),
    onBack: vi.fn(),
    onHint: vi.fn(),
    onTip: vi.fn(),
    ...overrides,
  }
}

describe('CardFields', () => {
  it('renders labelled front/back/hint/tip fields', () => {
    renderWithProviders(<CardFields {...cardFieldsProps()} />)
    expect(screen.getByText('Front (what to recall)')).toBeInTheDocument()
    expect(screen.getByText('Back (what it means)')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('e.g. Genesis 1:1')).toBeInTheDocument()
  })

  it('fires the change callbacks as their fields are edited', async () => {
    const user = userEvent.setup()
    const onFront = vi.fn()
    const onBack = vi.fn()
    renderWithProviders(<CardFields {...cardFieldsProps({ onFront, onBack })} />)

    await user.type(screen.getByPlaceholderText('e.g. Genesis 1:1'), 'A')
    expect(onFront).toHaveBeenCalledWith('A')

    await user.type(
      screen.getByPlaceholderText('In the beginning God created the heavens and the earth.'),
      'B',
    )
    expect(onBack).toHaveBeenCalledWith('B')
  })
})

function questionFieldsProps(overrides: Partial<Parameters<typeof QuestionFields>[0]> = {}) {
  return {
    prompt: '',
    options: ['', ''],
    correct: 0,
    explanation: '',
    onPrompt: vi.fn(),
    onOption: vi.fn(),
    onAddOption: vi.fn(),
    onRemoveOption: vi.fn(),
    onCorrect: vi.fn(),
    onExplanation: vi.fn(),
    ...overrides,
  }
}

describe('QuestionFields', () => {
  it('renders the prompt, options and add-option control', () => {
    renderWithProviders(<QuestionFields {...questionFieldsProps()} />)
    expect(screen.getByText('Question')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Option A')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Option B')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add option' })).toBeInTheDocument()
  })

  it('marks an option correct when its circle is tapped', async () => {
    const user = userEvent.setup()
    const onCorrect = vi.fn()
    renderWithProviders(<QuestionFields {...questionFieldsProps({ onCorrect })} />)
    await user.click(screen.getByRole('button', { name: 'Mark as correct' }))
    expect(onCorrect).toHaveBeenCalledWith(1)
  })

  it('edits an option through onOption', async () => {
    const user = userEvent.setup()
    const onOption = vi.fn()
    renderWithProviders(<QuestionFields {...questionFieldsProps({ onOption })} />)
    await user.type(screen.getByPlaceholderText('Option A'), 'X')
    expect(onOption).toHaveBeenCalledWith(0, 'X')
  })
})
