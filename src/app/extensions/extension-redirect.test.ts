import { describe, expect, it } from 'vitest'
import { ROUTES } from '@/shared/config/routes'
import { extensionRedirect } from './extension-redirect'

const toSettings = { to: ROUTES.settingsExtensions, search: { highlight: 'bible' } }

describe('extensionRedirect', () => {
  it('lets the route render while the extension is active', () => {
    expect(extensionRedirect('bible', true)).toBeNull()
  })

  it('sends a learner whose extension is off to Settings, saying which one', () => {
    expect(extensionRedirect('bible', false)).toEqual(toSettings)
  })
})
