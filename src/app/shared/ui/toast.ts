import { inject, Injectable } from '@angular/core'
import { MessageService } from 'primeng/api'

export interface UndoAction {
  label: string
  run: () => void
}

/** App toasts (PrimeNG owns toasts, ADR-0002): success/error, plus an undo variant
 *  rendered by the `key="undo"` host in the app shell. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly messages = inject(MessageService)

  success(detail: string): void {
    this.messages.add({ severity: 'success', detail, life: 3200 })
  }

  error(detail: string): void {
    this.messages.add({ severity: 'error', detail, life: 4200 })
  }

  /** A success toast carrying a single undo affordance. */
  undo(detail: string, undo: UndoAction): void {
    this.messages.add({ key: 'undo', severity: 'success', detail, life: 5200, data: undo })
  }

  dismissUndo(): void {
    this.messages.clear('undo')
  }
}
