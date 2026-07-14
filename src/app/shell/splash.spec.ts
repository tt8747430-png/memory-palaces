import { describe, expect, it, vi } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { TranslocoTestingModule } from '@jsverse/transloco'
import { Splash } from './splash'

async function renderSplash() {
  await TestBed.configureTestingModule({
    imports: [
      Splash,
      TranslocoTestingModule.forRoot({
        langs: {
          en: {
            common: { appName: 'Mindscape' },
            auth: { splash: { skip: 'Skip', tagline: 'Remember everything' } },
          },
        },
        translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
      }),
    ],
  }).compileComponents()

  const fixture = TestBed.createComponent(Splash)
  const onDone = vi.fn()
  fixture.componentInstance.done.subscribe(onDone)
  await fixture.whenStable()
  return { fixture, onDone }
}

describe('Splash', () => {
  it('shows the brand and dismisses on skip', async () => {
    const { fixture, onDone } = await renderSplash()
    const host = fixture.nativeElement as HTMLElement

    expect(host.textContent).toContain('Mindscape')

    host.querySelector('button')?.click()
    await new Promise((resolve) => setTimeout(resolve, 450))
    expect(onDone).toHaveBeenCalled()
  })

  it('auto-dismisses after its timer', async () => {
    const { onDone } = await renderSplash()
    await vi.waitFor(() => expect(onDone).toHaveBeenCalled(), { timeout: 3500 })
  })
})
