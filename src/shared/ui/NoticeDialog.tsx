import type { ReactElement, ReactNode } from 'react'
import { Button } from './primitives/button'
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './primitives/alert-dialog'

export interface NoticeDialogProps {
  /**
   * The control the learner reached for. Pressing it opens the notice, which keeps its own open
   * state — so no caller wires a flag just to explain itself.
   */
  trigger: ReactElement
  title: ReactNode
  description: ReactNode
  /** The one answer there is — "Got it". */
  acknowledgeLabel: string
}

/**
 * Tells the learner why something they reached for is not on offer here, and where it is. One
 * button, because there is nothing to decide: `ConfirmDialog` is the one that asks.
 */
export function NoticeDialog({ trigger, title, description, acknowledgeLabel }: NoticeDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={trigger} />
      <AlertDialogContent>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
        <AlertDialogClose render={<Button size="lg" className="mt-6 w-full" />}>
          {acknowledgeLabel}
        </AlertDialogClose>
      </AlertDialogContent>
    </AlertDialog>
  )
}
