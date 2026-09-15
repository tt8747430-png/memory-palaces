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
  trigger: ReactElement
  title: ReactNode
  description: ReactNode
  acknowledgeLabel: string
}

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
