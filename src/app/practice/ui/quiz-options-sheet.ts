import { Component, inject } from '@angular/core'
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet'
import { Shuffle, Timer } from 'lucide-angular'
import { TranslocoPipe } from '@jsverse/transloco'
import { SheetShell } from '@app/shared/ui/sheet-shell'
import { SettingsRow } from '@app/shared/ui/settings-row'
import { SettingsSection } from '@app/shared/ui/settings-section'

export interface QuizOptionsSheetData {
  quizTimer: boolean
  shuffleQuestions: boolean
  onQuizTimer: (value: boolean) => void
  onShuffleQuestions: (value: boolean) => void
}

/** Mid-quiz options: auto-advance timer and question shuffle. Toggles apply
 *  immediately through the callbacks; closing just dismisses. */
@Component({
  selector: 'ms-quiz-options-sheet',
  imports: [SheetShell, SettingsRow, SettingsSection, TranslocoPipe],
  template: `
    <ms-sheet-shell [title]="'quiz.options.title' | transloco" (closed)="ref.dismiss()">
      <div class="pb-2">
        <ms-settings-section>
          <ms-settings-row
            kind="toggle"
            [icon]="timer"
            [label]="'quiz.options.autoAdvance' | transloco"
            [description]="'quiz.options.autoAdvanceHint' | transloco"
            [checked]="data.quizTimer"
            (checkedChange)="data.onQuizTimer($event)"
          />
          <ms-settings-row
            kind="toggle"
            [icon]="shuffle"
            [label]="'quiz.options.shuffle' | transloco"
            [description]="'quiz.options.shuffleHint' | transloco"
            [checked]="data.shuffleQuestions"
            (checkedChange)="data.onShuffleQuestions($event)"
          />
        </ms-settings-section>
      </div>
      <span footer></span>
    </ms-sheet-shell>
  `,
  host: { class: 'flex max-h-full min-h-0 flex-col' },
})
export class QuizOptionsSheet {
  protected readonly data = inject<QuizOptionsSheetData>(MAT_BOTTOM_SHEET_DATA)
  protected readonly ref = inject(MatBottomSheetRef<QuizOptionsSheet>)

  protected readonly timer = Timer
  protected readonly shuffle = Shuffle
}
