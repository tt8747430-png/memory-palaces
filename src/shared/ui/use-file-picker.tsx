import { type ChangeEvent, type ReactNode, useRef } from 'react'

export interface FilePicker {
  /** Opens the system file chooser. */
  open: () => void
  /** The hidden input the picker drives — render it once, anywhere. */
  input: ReactNode
}

/**
 * A file chooser with no visible trigger, so a sheet row — or any control — can open it. Picking
 * the same file twice still fires `onPick`: the input clears itself after every change.
 */
export function useFilePicker(accept: string, onPick: (file: File) => void): FilePicker {
  const ref = useRef<HTMLInputElement>(null)

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) onPick(file)
  }

  return {
    open: () => ref.current?.click(),
    input: (
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={onChange}
        aria-hidden
        tabIndex={-1}
      />
    ),
  }
}
