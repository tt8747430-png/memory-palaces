import { describe, expect, it } from 'vitest'
import { makePreferences, type Preferences } from '@/entities/preferences'
import { ROUTES } from '@/shared/config/routes'
import { extensionRedirect } from './extension-redirect'

const stored = (extensions: string[]): Preferences => ({
  ...makePreferences({ id: 'preferences', createdAt: new Date(0).toISOString() }),
  extensions,
})

describe('extensionRedirect', () => {
  it('lets the route render while the extension is on', () => {
    expect(extensionRedirect(stored(['bible']), 'bible')).toBeNull()
  })

  it('sends a reader whose extension is off to Settings, saying which one', () => {
    expect(extensionRedirect(stored([]), 'bible')).toEqual({
      to: ROUTES.settingsExtensions,
      search: { highlight: 'bible' },
    })
  })

  it('redirects the same way when nothing is stored at all', () => {
    expect(extensionRedirect(null, 'bible')).toEqual({
      to: ROUTES.settingsExtensions,
      search: { highlight: 'bible' },
    })
  })
})
