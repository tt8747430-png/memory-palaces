import { Component, computed, inject } from '@angular/core'
import { Router } from '@angular/router'
import { Location } from '@angular/common'
import {
  ArrowLeftRight,
  Bell,
  CheckSquare,
  ChevronRight,
  Globe,
  HelpCircle,
  Info,
  LogIn,
  LogOut,
  LucideAngularModule,
  Monitor,
  Moon,
  Palette,
  Shield,
  Sparkles,
  Sun,
  Target,
  Vibrate,
  Volume2,
} from 'lucide-angular'
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco'
import { AVAILABLE_LANGUAGES, DAILY_GOAL_OPTIONS } from '@app/shared/config/constants'
import { ROUTES } from '@app/shared/config/routes'
import { Avatar } from '@app/shared/ui/avatar'
import { ConfirmDialog } from '@app/shared/ui/confirm-dialog'
import { ScreenHeader } from '@app/shared/ui/screen-header'
import { SettingsRow } from '@app/shared/ui/settings-row'
import type { SettingsSelectOption } from '@app/shared/ui/settings-row'
import { SettingsSection } from '@app/shared/ui/settings-section'
import { ProfileStore, SessionStore, profileHandle } from '@app/auth'
import { AuthActions } from '@app/auth/ui/auth-actions'
import { PreferencesStore } from '../data/preferences-store'
import { setPreferences } from '../commands/set-preferences'
import type { PreferencesChanges, Theme } from '../model/preferences'

/**
 * The settings hub: profile lead-in, preference toggles and pickers, and the
 * nav rows into each settings subpage. Every change writes straight through the
 * preferences command; sign-out asks first.
 */
@Component({
  selector: 'ms-settings-page',
  imports: [Avatar, ScreenHeader, SettingsRow, SettingsSection, LucideAngularModule, TranslocoPipe],
  template: `
    <ms-screen-header
      [title]="'settings.title' | transloco"
      [backLabel]="'settings.back' | transloco"
      (back)="back()"
    />

    <main class="min-h-0 flex-1 overflow-y-auto px-5 pb-safe overscroll-contain scrollbar-hide">
      <div class="mt-4 flex flex-col gap-5 pb-28">
        <button
          type="button"
          (click)="go(routes.settingsProfile)"
          class="group flex w-full items-center gap-4 rounded-card bg-card p-4 text-left shadow-rest transition-[transform,background-color] duration-200 ease-out active:scale-[0.99] active:bg-primary/[0.04]"
        >
          <ms-avatar
            [name]="name()"
            [src]="profile().avatar"
            class="size-16 text-xl shadow-rest transition-transform duration-200 ease-out group-active:scale-[0.96]"
          />
          <span class="min-w-0 flex-1">
            <span
              class="block truncate text-[length:var(--ms-text-title)] font-semibold text-heading"
            >
              {{ name() }}
            </span>
            <span class="block truncate text-[length:var(--ms-text-sub)] text-muted-foreground">
              {{ handle() ? '@' + handle() : ('settings.profileHint' | transloco) }}
            </span>
          </span>
          <lucide-icon
            [img]="icons.chevronRight"
            class="size-5 shrink-0 text-muted-foreground transition-transform duration-200 ease-out group-active:translate-x-0.5"
            aria-hidden="true"
          />
        </button>

        @if (isGuest()) {
          <ms-settings-section>
            <ms-settings-row
              kind="nav"
              [icon]="icons.logIn"
              [label]="'settings.guestCtaTitle' | transloco"
              [description]="'settings.guestCtaHint' | transloco"
              (activate)="go(routes.login)"
            />
          </ms-settings-section>
        }

        <ms-settings-section [title]="'settings.preferencesSection' | transloco">
          <ms-settings-row
            kind="toggle"
            [icon]="icons.bell"
            [label]="'settings.notifications' | transloco"
            [description]="'settings.notificationsHint' | transloco"
            [checked]="prefs().notifications"
            (checkedChange)="update({ notifications: $event })"
          />
          <ms-settings-row
            kind="toggle"
            [icon]="icons.volume"
            [label]="'settings.sound' | transloco"
            [description]="'settings.soundHint' | transloco"
            [checked]="prefs().soundEffects"
            (checkedChange)="update({ soundEffects: $event })"
          />
          <ms-settings-row
            kind="toggle"
            [icon]="icons.vibrate"
            [label]="'settings.haptics' | transloco"
            [description]="'settings.hapticsHint' | transloco"
            [checked]="prefs().haptics"
            (checkedChange)="update({ haptics: $event })"
          />
          <ms-settings-row
            kind="toggle"
            [icon]="icons.sparkles"
            [label]="'settings.reducedMotion' | transloco"
            [description]="'settings.reducedMotionHint' | transloco"
            [checked]="prefs().reducedMotion"
            (checkedChange)="update({ reducedMotion: $event })"
          />
          <ms-settings-row
            kind="select"
            [icon]="icons.target"
            [label]="'settings.dailyGoal' | transloco"
            [description]="'settings.dailyGoalHint' | transloco"
            [value]="String(prefs().dailyGoal)"
            [options]="dailyGoalOptions"
            (valueChange)="update({ dailyGoal: Number($event) })"
          />
          <ms-settings-row
            kind="select"
            [icon]="icons.palette"
            [label]="'settings.theme' | transloco"
            [description]="'settings.themeHint' | transloco"
            [value]="prefs().theme"
            [options]="themeOptions()"
            (valueChange)="setTheme($event)"
          />
          <ms-settings-row
            kind="select"
            [icon]="icons.globe"
            [label]="'settings.language' | transloco"
            [description]="'settings.languageHint' | transloco"
            [value]="prefs().language"
            [options]="languageOptions"
            (valueChange)="setLanguage($event)"
          />
          <ms-settings-row
            kind="nav"
            [icon]="icons.arrowLeftRight"
            [label]="'settings.swipeActions' | transloco"
            [description]="'settings.swipeActionsHint' | transloco"
            (activate)="go(routes.settingsSwipe)"
          />
          <ms-settings-row
            kind="nav"
            [icon]="icons.checkSquare"
            [label]="'settings.selectToolbar' | transloco"
            [description]="'settings.selectToolbarHint' | transloco"
            (activate)="go(routes.settingsSelect)"
          />
        </ms-settings-section>

        <ms-settings-section [title]="'settings.privacySection' | transloco">
          <ms-settings-row
            kind="nav"
            [icon]="icons.shield"
            [label]="'settings.privacy' | transloco"
            (activate)="go(routes.settingsPrivacy)"
          />
        </ms-settings-section>

        <ms-settings-section [title]="'settings.supportSection' | transloco">
          <ms-settings-row
            kind="nav"
            [icon]="icons.helpCircle"
            [label]="'settings.helpCenter' | transloco"
            (activate)="go(routes.settingsHelp)"
          />
          <ms-settings-row
            kind="nav"
            [icon]="icons.info"
            [label]="'settings.about' | transloco"
            (activate)="go(routes.settingsAbout)"
          />
        </ms-settings-section>

        @if (!isGuest()) {
          <ms-settings-section>
            <ms-settings-row
              kind="nav"
              tone="danger"
              [icon]="icons.logOut"
              [label]="'settings.signOut' | transloco"
              (activate)="confirmSignOut()"
            />
          </ms-settings-section>
        }
      </div>
    </main>
  `,
  host: { class: 'mx-auto flex h-full w-full max-w-[430px] flex-col' },
})
export class SettingsPage {
  private readonly router = inject(Router)
  private readonly location = inject(Location)
  private readonly transloco = inject(TranslocoService)
  private readonly confirmDialog = inject(ConfirmDialog)
  private readonly preferencesStore = inject(PreferencesStore)
  private readonly profileStore = inject(ProfileStore)
  private readonly sessionStore = inject(SessionStore)
  private readonly authActions = inject(AuthActions)

  protected readonly icons = {
    arrowLeftRight: ArrowLeftRight,
    bell: Bell,
    checkSquare: CheckSquare,
    chevronRight: ChevronRight,
    globe: Globe,
    helpCircle: HelpCircle,
    info: Info,
    logIn: LogIn,
    logOut: LogOut,
    palette: Palette,
    shield: Shield,
    sparkles: Sparkles,
    target: Target,
    vibrate: Vibrate,
    volume: Volume2,
  }

  protected readonly routes = ROUTES
  protected readonly String = String
  protected readonly Number = Number

  protected readonly prefs = computed(() => this.preferencesStore.effective())
  protected readonly profile = computed(() => this.profileStore.effective())

  protected readonly name = computed(
    () => this.profile().name.trim() || this.transloco.translate('settings.namePlaceholder'),
  )
  protected readonly handle = computed(() => profileHandle(this.profile()))
  protected readonly isGuest = computed(() => this.sessionStore.session()?.kind === 'guest')

  protected readonly dailyGoalOptions: SettingsSelectOption[] = DAILY_GOAL_OPTIONS.map((n) => ({
    value: String(n),
    label: String(n),
  }))

  protected readonly themeOptions = computed<SettingsSelectOption[]>(() => [
    { value: 'light', label: this.t('settings.themeLight'), icon: Sun },
    { value: 'dark', label: this.t('settings.themeDark'), icon: Moon },
    { value: 'system', label: this.t('settings.themeSystem'), icon: Monitor },
  ])

  protected readonly languageOptions: SettingsSelectOption[] = AVAILABLE_LANGUAGES.map(
    (language) => ({ value: language.code, label: language.label, icon: Globe }),
  )

  protected update(changes: PreferencesChanges): void {
    void setPreferences(this.preferencesStore, changes)
  }

  protected setTheme(value: string): void {
    this.update({ theme: value as Theme })
  }

  protected setLanguage(code: string): void {
    this.transloco.setActiveLang(code)
    this.update({ language: code })
  }

  protected back(): void {
    this.location.back()
  }

  protected go(path: string): void {
    void this.router.navigateByUrl(path)
  }

  protected async confirmSignOut(): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      icon: LogOut,
      title: this.t('settings.signOutConfirmTitle'),
      description: this.t('settings.signOutConfirmBody'),
      confirmLabel: this.t('settings.signOutConfirmCta'),
      cancelLabel: this.t('common.cancel'),
    })
    if (!confirmed) return
    await this.authActions.signOut()
    void this.router.navigateByUrl(ROUTES.welcome)
  }

  private t(key: string): string {
    return this.transloco.translate(key)
  }
}
