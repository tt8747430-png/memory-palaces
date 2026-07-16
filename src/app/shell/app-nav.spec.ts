import { describe, it, expect, beforeEach } from 'vitest'
import { Component } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { Router, provideRouter } from '@angular/router'
import { TranslocoTestingModule } from '@jsverse/transloco'
import { AppNav } from './app-nav'

@Component({ template: '' })
class Blank {}

describe('AppNav', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AppNav,
        TranslocoTestingModule.forRoot({
          langs: { en: { nav: { label: 'Primary', home: 'Home', profile: 'Profile' } } },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
        }),
      ],
      providers: [
        provideRouter([
          { path: '', component: Blank },
          { path: 'profile', component: Blank },
          { path: 'decks/:deckId', component: Blank },
        ]),
      ],
    }).compileComponents()
  })

  const renderAt = async (url: string): Promise<HTMLElement> => {
    await TestBed.inject(Router).navigateByUrl(url)
    const fixture = TestBed.createComponent(AppNav)
    await fixture.whenStable()
    fixture.detectChanges()
    return fixture.nativeElement as HTMLElement
  }

  it('renders both destinations on a tab route', async () => {
    const el = await renderAt('/')
    expect(el.querySelectorAll('a').length).toBe(2)
    expect(el.querySelector('nav')?.getAttribute('aria-label')).toBe('Primary')
  })

  it('labels each destination', async () => {
    const el = await renderAt('/')
    expect(el.textContent).toContain('Home')
    expect(el.textContent).toContain('Profile')
  })

  it('marks the current destination with aria-current', async () => {
    const el = await renderAt('/')
    const current = el.querySelectorAll('a[aria-current="page"]')
    expect(current.length).toBe(1)
    expect(current[0]?.getAttribute('href')).toBe('/')
  })

  it('marks profile current when on profile', async () => {
    const el = await renderAt('/profile')
    const current = el.querySelectorAll('a[aria-current="page"]')
    expect(current.length).toBe(1)
    expect(current[0]?.getAttribute('href')).toBe('/profile')
  })

  // Home uses exact matching, so it must not stay lit on a deeper route.
  it('hides entirely on a non-tab route', async () => {
    const el = await renderAt('/decks/abc')
    expect(el.querySelector('nav')).toBeNull()
  })
})
