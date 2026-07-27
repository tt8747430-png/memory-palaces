import { useTranslation } from 'react-i18next'
import { ClipboardPaste, Plus } from 'lucide-react'
import { Button, Empty } from '@/shared/ui'

export interface LibraryEmptyProps {
  inFolder: boolean
  canImport: boolean
  onCreateDeck: () => void
  onImport: () => void
}

export function LibraryEmpty({ inFolder, canImport, onCreateDeck, onImport }: LibraryEmptyProps) {
  const { t } = useTranslation()
  return (
    <Empty
      emoji={inFolder ? '📂' : '🗂️'}
      title={inFolder ? t('library.emptyFolderTitle') : t('library.emptyTitle')}
      description={inFolder ? t('library.emptyFolderHint') : t('library.emptyHint')}
      action={
        <div className="flex w-full max-w-60 flex-col gap-2">
          <Button onClick={onCreateDeck}>
            <Plus className="size-[18px]" aria-hidden />
            {inFolder ? t('folder.addDeck') : t('deck.newDeck')}
          </Button>
          {canImport ? (
            <Button variant="secondary" onClick={onImport}>
              <ClipboardPaste className="size-[18px]" aria-hidden />
              {t('deck.importCards')}
            </Button>
          ) : null}
        </div>
      }
    />
  )
}
