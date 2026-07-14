import { describe, it, expect, beforeEach } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'
import { provideServiceWorker } from '@angular/service-worker'
import { provideTaiga } from '@taiga-ui/core'
import { MessageService } from 'primeng/api'
import { TranslocoTestingModule } from '@jsverse/transloco'
import { App } from './app'
import { provideAppData } from './data.providers'

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        App,
        TranslocoTestingModule.forRoot({
          langs: { en: {} },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
        }),
      ],
      providers: [
        provideRouter([]),
        provideTaiga(),
        provideAppData(),
        provideServiceWorker('ngsw-worker.js', { enabled: false }),
        MessageService,
      ],
    }).compileComponents()
  })

  it('creates the app shell', () => {
    const fixture = TestBed.createComponent(App)
    expect(fixture.componentInstance).toBeTruthy()
  })

  it('renders the router outlet and bottom navigation inside tui-root', async () => {
    const fixture = TestBed.createComponent(App)
    await fixture.whenStable()
    const compiled = fixture.nativeElement as HTMLElement
    expect(compiled.querySelector('tui-root router-outlet')).toBeTruthy()
    expect(compiled.querySelector('ms-app-nav')).toBeTruthy()
  })
})
