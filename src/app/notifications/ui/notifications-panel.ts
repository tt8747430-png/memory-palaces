import { Component, computed, inject, input, output } from '@angular/core'
import { MatIconButton } from '@angular/material/button'
import { BellOff, Flame, LucideAngularModule, Star, Trophy, X, Zap } from 'lucide-angular'
import type { LucideIconData } from 'lucide-angular'
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco'
import type { AppNotification, NotificationType } from '../model/notification'
import { bucketOf, relativeTime } from '../model/group'
import type { DayBucket } from '../model/group'

interface Visual {
  icon: LucideIconData
  fg: string
  tint: string
}

const VISUALS: Record<NotificationType, Visual> = {
  'level-up': {
    icon: Trophy,
    fg: 'var(--rating-edge)',
    tint: 'color-mix(in oklch, var(--rating) 30%, var(--surface))',
  },
  streak: {
    icon: Flame,
    fg: 'var(--warning-foreground)',
    tint: 'color-mix(in oklch, var(--warning) 22%, var(--surface))',
  },
  quiz: {
    icon: Star,
    fg: 'var(--info-foreground)',
    tint: 'color-mix(in oklch, var(--secondary) 45%, var(--surface))',
  },
}

const BUCKET_ORDER: DayBucket[] = ['today', 'yesterday', 'earlier']

interface NotificationView {
  notification: AppNotification
  visual: Visual
  title: string
  subtitle: string
  when: string
}

/** Notifications grouped by day (today / yesterday / earlier); each row carries its
 *  reward context and an inline dismiss. */
@Component({
  selector: 'ms-notifications-panel',
  imports: [MatIconButton, LucideAngularModule, TranslocoPipe],
  template: `
    @if (notifications().length === 0) {
      <div class="flex flex-col items-center gap-4 px-6 pt-24 text-center">
        <span
          class="grid size-20 place-items-center rounded-card-featured bg-info-surface text-info-foreground shadow-rest"
        >
          <lucide-icon [img]="icons.bellOff" class="size-9" aria-hidden="true" />
        </span>
        <div class="flex flex-col gap-1.5">
          <h2 class="text-[length:var(--ms-text-headline)] font-bold text-heading">
            {{ 'notifications.emptyTitle' | transloco }}
          </h2>
          <p
            class="max-w-[34ch] text-[length:var(--ms-text-body)] text-pretty text-muted-foreground"
          >
            {{ 'notifications.emptyBody' | transloco }}
          </p>
        </div>
      </div>
    } @else {
      <div class="flex flex-col gap-6">
        @for (section of sections(); track section.bucket) {
          <section>
            <h2
              class="mb-2 px-1 text-[length:var(--ms-text-tiny)] font-semibold tracking-wide text-muted-foreground uppercase"
            >
              {{ 'notifications.' + section.bucket | transloco }}
            </h2>
            <ul class="m-0 flex list-none flex-col gap-2 p-0">
              @for (item of section.items; track item.notification.id) {
                <li
                  class="relative flex items-start gap-3 rounded-card bg-card p-3.5 shadow-rest"
                  [class]="
                    item.notification.read
                      ? ''
                      : 'ring-1 ring-[color-mix(in_oklch,var(--secondary)_55%,transparent)]'
                  "
                >
                  @if (!item.notification.read) {
                    <span
                      class="absolute top-1/2 left-1 size-1.5 -translate-y-1/2 rounded-full bg-primary"
                      aria-hidden="true"
                    ></span>
                  }
                  <span
                    class="grid size-10 shrink-0 place-items-center rounded-control"
                    [style.color]="item.visual.fg"
                    [style.background-color]="item.visual.tint"
                  >
                    <lucide-icon [img]="item.visual.icon" class="size-5" aria-hidden="true" />
                  </span>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                      <p
                        class="truncate text-[length:var(--ms-text-label)] font-semibold text-heading"
                      >
                        {{ item.title }}
                      </p>
                      @if (item.notification.xpGain; as xp) {
                        <span
                          class="inline-flex shrink-0 items-center gap-1 rounded-pill bg-info-surface px-1.5 py-0.5 text-[length:var(--ms-text-tiny)] font-semibold text-info-foreground"
                        >
                          <lucide-icon
                            [img]="icons.zap"
                            class="size-3"
                            fill="currentColor"
                            aria-hidden="true"
                          />
                          {{ '+' + xp }}
                        </span>
                      }
                    </div>
                    <p class="mt-0.5 text-[length:var(--ms-text-label)] text-muted-foreground">
                      {{ item.subtitle }}
                    </p>
                    <p class="mt-1 text-[length:var(--ms-text-tiny)] text-muted-foreground">
                      {{ item.when }}
                    </p>
                  </div>
                  <button
                    matIconButton
                    type="button"
                    class="ms-dismiss shrink-0"
                    [attr.aria-label]="'notifications.removeLabel' | transloco"
                    (click)="remove.emit(item.notification.id)"
                  >
                    <lucide-icon [img]="icons.x" class="size-4" aria-hidden="true" />
                  </button>
                </li>
              }
            </ul>
          </section>
        }
      </div>
    }
  `,
  host: { class: 'block' },
  styles: `
    .ms-dismiss {
      --mat-icon-button-state-layer-size: 36px;
      width: 36px;
      height: 36px;
      padding: 6px;
    }
  `,
})
export class NotificationsPanel {
  readonly notifications = input.required<AppNotification[]>()
  readonly now = input(Date.now())
  readonly remove = output<string>()

  private readonly transloco = inject(TranslocoService)

  protected readonly icons = { bellOff: BellOff, zap: Zap, x: X }

  protected readonly sections = computed(() => {
    const now = this.now()
    const buckets: Record<DayBucket, NotificationView[]> = {
      today: [],
      yesterday: [],
      earlier: [],
    }
    for (const notification of this.notifications()) {
      buckets[bucketOf(notification.createdAt, now)].push(this.viewOf(notification, now))
    }
    return BUCKET_ORDER.filter((bucket) => buckets[bucket].length > 0).map((bucket) => ({
      bucket,
      items: buckets[bucket],
    }))
  })

  private viewOf(notification: AppNotification, now: number): NotificationView {
    return {
      notification,
      visual: VISUALS[notification.type],
      title: this.titleOf(notification),
      subtitle: this.subtitleOf(notification),
      when: this.formatRelative(notification.createdAt, now),
    }
  }

  private titleOf(n: AppNotification): string {
    switch (n.type) {
      case 'level-up':
        return this.transloco.translate('notifications.levelUpTitle', { level: n.level ?? 0 })
      case 'streak':
        return this.transloco.translate('notifications.streakTitle', { count: n.count ?? 0 })
      case 'quiz':
        return this.transloco.translate('notifications.quizTitle')
    }
  }

  private subtitleOf(n: AppNotification): string {
    switch (n.type) {
      case 'level-up':
        return this.transloco.translate('notifications.levelUpBody')
      case 'streak':
        return this.transloco.translate('notifications.streakBody', { count: n.count ?? 0 })
      case 'quiz':
        return this.transloco.translate('notifications.quizBody', { accuracy: n.accuracy ?? 0 })
    }
  }

  private formatRelative(iso: string, now: number): string {
    const r = relativeTime(iso, now)
    switch (r.unit) {
      case 'now':
        return this.transloco.translate('notifications.justNow')
      case 'minutes':
        return this.transloco.translate('notifications.minutesAgo', { count: r.value })
      case 'hours':
        return this.transloco.translate('notifications.hoursAgo', { count: r.value })
      case 'days':
        return this.transloco.translate('notifications.daysAgo', { count: r.value })
      case 'date':
        return new Date(r.iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    }
  }
}
