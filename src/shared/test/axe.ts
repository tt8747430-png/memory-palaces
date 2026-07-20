import axe from 'axe-core'
import { expect } from 'vitest'

/**
 * The per-page a11y smoke gate (Global Constraints). Runs axe-core over a rendered
 * container. color-contrast is disabled because jsdom performs no real layout or
 * paint — contrast is covered by each phase's manual WCAG AA pass in a browser.
 */
export async function expectNoA11yViolations(container: Element): Promise<void> {
  const { violations } = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false } },
  })
  expect(violations).toEqual([])
}
