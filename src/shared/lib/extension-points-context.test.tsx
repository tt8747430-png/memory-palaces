import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { ExtensionPointsContext, useExtensionPoint } from './extension-points-context'
import type { ImportOptionContribution } from './extension-manifest'

const bibleRow: ImportOptionContribution = {
  id: 'bible',
  icon: null,
  titleKey: 'bible:label',
  subtitleKey: 'bible:importSubtitle',
  to: '/import/bible',
}

function Host() {
  const options = useExtensionPoint('importOptions')
  return (
    <ul>
      {options.map((option) => (
        <li key={option.id}>{option.titleKey}</li>
      ))}
    </ul>
  )
}

afterEach(cleanup)

describe('useExtensionPoint', () => {
  it('returns nothing when no extension has contributed', () => {
    render(<Host />)
    expect(screen.queryByText('bible:label')).not.toBeInTheDocument()
  })

  it('returns what the enabled extensions contributed', () => {
    render(
      <ExtensionPointsContext value={{ importOptions: [bibleRow] }}>
        <Host />
      </ExtensionPointsContext>,
    )
    expect(screen.getByText('bible:label')).toBeInTheDocument()
  })

  it('is stable when the point has no contributions, so hosts can render it directly', () => {
    render(
      <ExtensionPointsContext value={{}}>
        <Host />
      </ExtensionPointsContext>,
    )
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
  })
})
