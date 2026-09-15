import { useTranslation } from 'react-i18next'
import { Lock } from 'lucide-react'
import type { Deck } from '@/entities/deck'
import { AppScreen, Button, Empty, ScreenHeader } from '@/shared/ui'

export interface MainDeckOnlyScreenProps {
  title: string
  deck: Deck
  mainDeck: Deck
  onBack?: () => void
  onOpenMainDeck?: (mainDeckId: string) => void
}

export function MainDeckOnlyScreen({
  title,
  deck,
  mainDeck,
  onBack,
  onOpenMainDeck,
}: MainDeckOnlyScreenProps) {
  const { t } = useTranslation()
  return (
    <AppScreen
      fill
      gutter="end"
      header={
        <ScreenHeader
          title={title}
          subtitle={deck.name}
          onBack={onBack}
          backLabel={t('common.back')}
        />
      }
    >
      <Empty
        icon={<Lock className="size-7" aria-hidden />}
        title={t('algorithm.locked.pageTitle')}
        description={t('algorithm.locked.pageBody', { name: deck.name, main: mainDeck.name })}
        action={
          onOpenMainDeck ? (
            <Button size="lg" onClick={() => onOpenMainDeck(mainDeck.id)}>
              {t('algorithm.locked.openMainDeck', { name: mainDeck.name })}
            </Button>
          ) : null
        }
      />
    </AppScreen>
  )
}
