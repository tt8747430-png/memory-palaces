import { Component, computed, inject, input, output } from '@angular/core'
import { MatIconButton } from '@angular/material/button'
import { ProgressBar } from 'primeng/progressbar'
import { Archive, Bell, BellRing, Flame, LucideAngularModule } from 'lucide-angular'
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco'
import { levelFromXp } from '@app/shared/domain'
import { Avatar } from '@app/shared/ui/avatar'

export interface StreakSummary {
  count: number
  dayCount: number
  dailyGoal: number
}

function greetingKey(hour: number): string {
  if (hour >= 5 && hour < 12) return 'greetingMorning'
  if (hour >= 12 && hour < 18) return 'greetingAfternoon'
  return 'greetingEvening'
}

/** Library home header: profile + level progress on the left, streak, notification
 *  and archive affordances on the right. Sticky, with a scroll-elevated shadow. */
@Component({
  selector: 'ms-home-header',
  imports: [Avatar, MatIconButton, ProgressBar, LucideAngularModule, TranslocoPipe],
  template: `
    <span aria-hidden="true" class="absolute inset-0 border-b border-border bg-glass"></span>
    <span
      aria-hidden="true"
      class="absolute inset-0 shadow-rest transition-opacity duration-200"
      [class.opacity-0]="!elevated()"
    ></span>

    <div
      class="relative flex min-h-12 items-center justify-between gap-3 px-5 pt-[calc(env(safe-area-inset-top)+0.625rem)] pb-2.5"
    >
      <button
        type="button"
        (click)="openProfile.emit()"
        [attr.aria-label]="profileAria()"
        class="flex min-w-0 flex-1 items-center gap-3 text-left transition-transform active:scale-[0.98]"
      >
        <span
          class="grid size-12 shrink-0 place-items-center rounded-full border border-[color:var(--border-glass)] bg-card-glass shadow-rest"
        >
          <ms-avatar
            [name]="name()"
            [src]="avatar()"
            class="size-11 text-[length:var(--ms-text-sub)]"
          />
        </span>
        <span class="flex min-w-0 flex-1 flex-col gap-1">
          <span
            class="truncate text-[length:var(--ms-text-sub)] leading-tight font-bold tracking-tight text-heading"
          >
            {{ 'home.' + greeting | transloco }}
          </span>
          <span class="flex items-center gap-2">
            <span class="shrink-0 text-[length:var(--ms-text-label)] font-semibold text-primary">
              {{ 'home.level' | transloco: { level: level().level } }}
            </span>
            <p-progressbar
              [value]="fill()"
              [showValue]="false"
              styleClass="ms-xp-bar"
              class="w-full max-w-[140px]"
              [attr.aria-label]="xpToNext()"
            />
          </span>
        </span>
      </button>

      <div class="flex shrink-0 items-center gap-0.5">
        @if (streak(); as s) {
          <button
            type="button"
            (click)="openStreak.emit()"
            [attr.aria-label]="
              'home.streakAria' | transloco: { count: s.count, done: s.dayCount, goal: s.dailyGoal }
            "
            class="inline-flex shrink-0 items-center gap-1 rounded-full bg-card px-2.5 py-1 text-[length:var(--ms-text-label)] font-semibold text-heading shadow-rest transition-transform active:scale-95"
          >
            <lucide-icon
              [img]="icons.flame"
              class="size-4"
              [class]="
                s.dayCount >= s.dailyGoal ? 'text-[var(--warning)]' : 'text-muted-foreground'
              "
              [attr.fill]="s.dayCount >= s.dailyGoal ? 'currentColor' : 'none'"
              aria-hidden="true"
            />
            <span class="tabular-nums">{{ s.count }}</span>
          </button>
        }

        <span class="relative shrink-0">
          <button
            matIconButton
            type="button"
            [attr.aria-label]="'notifications.openLabel' | transloco"
            (click)="openNotifications.emit()"
          >
            <lucide-icon
              [img]="unreadCount() > 0 ? icons.bellRing : icons.bell"
              class="size-5"
              aria-hidden="true"
            />
          </button>
          @if (unreadCount() > 0) {
            <span
              class="absolute -top-0.5 -right-0.5 grid min-w-[18px] place-items-center rounded-full bg-destructive px-1 text-[10px] leading-none font-bold text-destructive-foreground ring-2 ring-[color:var(--surface)]"
            >
              {{ unreadCount() > 9 ? '9+' : unreadCount() }}
            </span>
          }
        </span>

        <button
          matIconButton
          type="button"
          [attr.aria-label]="'home.archive' | transloco"
          (click)="openArchived.emit()"
        >
          <lucide-icon [img]="icons.archive" class="size-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  `,
  host: { class: 'relative block shrink-0' },
})
export class HomeHeader {
  readonly name = input.required<string>()
  readonly avatar = input<string | null>(null)
  readonly xp = input.required<number>()
  readonly unreadCount = input.required<number>()
  readonly streak = input<StreakSummary | null>(null)
  readonly elevated = input(false)
  readonly openProfile = output<void>()
  readonly openNotifications = output<void>()
  readonly openArchived = output<void>()
  readonly openStreak = output<void>()

  private readonly transloco = inject(TranslocoService)

  protected readonly icons = { archive: Archive, bell: Bell, bellRing: BellRing, flame: Flame }
  protected readonly greeting = greetingKey(new Date().getHours())

  protected readonly level = computed(() => levelFromXp(this.xp()))
  protected readonly fill = computed(() => {
    const { xpInLevel, xpForNextLevel } = this.level()
    return Math.round(Math.max(0, Math.min(1, xpInLevel / xpForNextLevel)) * 100)
  })

  protected readonly xpToNext = computed(() => {
    const { level, xpInLevel, xpForNextLevel } = this.level()
    return this.transloco.translate('home.xpToNext', {
      remaining: xpForNextLevel - xpInLevel,
      next: level + 1,
    })
  })

  protected readonly profileAria = computed(() => {
    const level = this.transloco.translate('home.level', { level: this.level().level })
    const open = this.transloco.translate('home.openProfile')
    return `${this.name()} — ${level}, ${this.xpToNext()}. ${open}`
  })
}
