import type { LibraryIndex } from '../../model/library-index'
import type { RecentPassage } from '../../model/recents'
import type { PassagePicker as Picker } from '../../model/use-passage-picker'
import { BookGrid } from './BookGrid'
import { JumpField } from './JumpField'
import { PassageGrid } from './PassageGrid'
import { PickerBreadcrumb } from './PickerBreadcrumb'
import { RecentChips } from './RecentChips'

export interface PassagePickerProps {
  picker: Picker
  index: LibraryIndex
  recents: readonly RecentPassage[]
}

/**
 * The picker while a passage is being chosen: books first (with the jump field and recent
 * chapters above them), then chapter and verses on one step. Once confirmed the page shows a
 * summary instead, so this renders nothing at `done`.
 */
export function PassagePicker({ picker, index, recents }: PassagePickerProps) {
  if (picker.step === 'done') return null
  return (
    <div className="flex flex-col gap-5">
      <JumpField onJump={picker.jump} />
      {picker.step === 'book' ? (
        <>
          <RecentChips
            recents={recents}
            onPick={(recent) => picker.jump({ ...recent, from: null, to: null })}
          />
          <BookGrid index={index} onPick={picker.pickBook} />
        </>
      ) : (
        <>
          <PickerBreadcrumb picker={picker} />
          <PassageGrid picker={picker} index={index} />
        </>
      )}
    </div>
  )
}
