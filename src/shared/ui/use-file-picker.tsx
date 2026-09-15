import { type ChangeEvent, type ReactNode, useRef } from 'react'

export interface FilePicker {
  open: () => void
  input: ReactNode
}

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
