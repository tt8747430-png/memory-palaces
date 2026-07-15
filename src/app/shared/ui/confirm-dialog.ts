import { Component, inject, Injectable } from '@angular/core'
import { firstValueFrom } from 'rxjs'
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog'
import { MatButton } from '@angular/material/button'
import { LucideAngularModule } from 'lucide-angular'
import type { LucideIconData } from 'lucide-angular'

export interface ConfirmDialogConfig {
  title: string
  description?: string
  icon?: LucideIconData
  confirmLabel: string
  cancelLabel: string
  destructive?: boolean
}

@Component({
  selector: 'ms-confirm-dialog',
  imports: [MatButton, LucideAngularModule],
  template: `
    @if (config.icon; as icon) {
      <span
        aria-hidden="true"
        class="mx-auto mb-4 grid size-14 place-items-center rounded-card-featured"
        [class]="
          config.destructive
            ? 'bg-[var(--danger-surface)] text-[var(--danger-on-surface)]'
            : 'text-primary-foreground shadow-interactive'
        "
        [style.background]="
          config.destructive ? null : 'linear-gradient(135deg, var(--primary), var(--accent))'
        "
      >
        <lucide-icon [img]="icon" class="size-6" aria-hidden="true" />
      </span>
    }

    <h1 class="text-[length:var(--ms-text-headline)] font-bold text-balance text-heading">
      {{ config.title }}
    </h1>
    @if (config.description) {
      <p
        class="mx-auto mt-2 max-w-[30ch] text-[length:var(--ms-text-body)] leading-relaxed text-muted-foreground"
      >
        {{ config.description }}
      </p>
    }

    <div class="mt-6 flex flex-col gap-2.5">
      <button
        matButton="filled"
        type="button"
        class="w-full"
        [class.ms-destructive]="config.destructive"
        (click)="ref.close(true)"
      >
        {{ config.confirmLabel }}
      </button>
      <button
        matButton
        type="button"
        class="w-full text-[length:var(--ms-text-sub)] font-semibold text-heading"
        (click)="ref.close(false)"
      >
        {{ config.cancelLabel }}
      </button>
    </div>
  `,
  host: { class: 'block p-6 text-center' },
  styles: `
    .ms-destructive {
      --mat-button-filled-container-color: var(--danger);
      --mat-button-filled-label-text-color: var(--danger-foreground);
    }
  `,
})
export class ConfirmDialogComponent {
  protected readonly config = inject<ConfirmDialogConfig>(MAT_DIALOG_DATA)
  protected readonly ref = inject(MatDialogRef<ConfirmDialogComponent, boolean>)
}

/** Confirmation dialog (MatDialog owns dialogs, ADR-0002); resolves true only on
 *  explicit confirm — backdrop and cancel both resolve false. */
@Injectable({ providedIn: 'root' })
export class ConfirmDialog {
  private readonly dialogs = inject(MatDialog)

  async confirm(config: ConfirmDialogConfig): Promise<boolean> {
    const ref = this.dialogs.open<ConfirmDialogComponent, ConfirmDialogConfig, boolean>(
      ConfirmDialogComponent,
      { data: config, panelClass: 'ms-dialog-panel', maxWidth: '340px', width: '100%' },
    )
    return (await firstValueFrom(ref.afterClosed())) === true
  }
}
