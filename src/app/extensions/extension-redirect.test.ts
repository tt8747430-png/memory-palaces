import { describe, expect, it } from 'vitest'
import { ROUTES } from '@/shared/config/routes'
import { extensionRedirect } from './extension-redirect'

const toSettings = { to: ROUTES.settingsExtensions, search: { highlight: 'bible' } }

describe('extensionRedirect', () => {
  it('lets the route render while the extension is active', () => {
    expect(extensionRedirect('bible', { active: true, admin: false, devMode: false })).toBeNull()
  })

  it('sends a learner whose extension is off to Settings, saying which one', () => {
    expect(extensionRedirect('bible', { active: false, admin: false, devMode: false })).toEqual(
      toSettings,
    )
  })

  it('keeps an admin route to dev mode, even with the extension on', () => {
    expect(extensionRedirect('bible', { active: true, admin: true, devMode: false })).toEqual(
      toSettings,
    )
    expect(extensionRedirect('bible', { active: true, admin: true, devMode: true })).toBeNull()
  })

  it('does not open an admin route of an extension that is off, dev mode or not', () => {
    expect(extensionRedirect('bible', { active: false, admin: true, devMode: true })).toEqual(
      toSettings,
    )
  })
})
