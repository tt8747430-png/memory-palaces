import { useNavigate } from '@tanstack/react-router'
import { CardEditorPage } from '@/pages/card-editor'
import { DeckDetailPage } from '@/pages/deck-detail'
import { DeckQuestionsPage } from '@/pages/deck-questions'
import { DeckAdvancedPage, DeckAlgorithmPage } from '@/pages/deck-algorithm'
import { DeckSettingsPage } from '@/pages/deck-settings'
import { ImportReviewPage } from '@/pages/import-review'
import { MatchPage } from '@/pages/match'
import { PasteNotesPage } from '@/pages/paste-notes'
import { QuestionEditorPage } from '@/pages/question-editor'
import { QuizPage } from '@/pages/quiz'
import { StudyCardsPage } from '@/pages/study'
import { selectDecks, useDeckStore, useDeckStoreApi } from '@/entities/deck'
import { createDeck } from '@/features/deck'
import { nextDefaultName } from '@/shared/lib'
import { ROUTES } from '@/shared/config/routes'
import { useBack } from './use-back'

function useBackToDeck(deckId: string, replace = false) {
  const navigate = useNavigate()
  return useBack(() => void navigate({ to: ROUTES.deckDetail, params: { deckId }, replace }))
}

export function DeckDetailScreen({ deckId }: { deckId: string }) {
  const navigate = useNavigate()
  const back = useBack(() => void navigate({ to: ROUTES.home }))
  return (
    <DeckDetailPage
      deckId={deckId}
      onBack={back}
      onOpenSettings={() => navigate({ to: ROUTES.deckSettings, params: { deckId } })}
      onStudy={() => navigate({ to: ROUTES.deckStudy, params: { deckId } })}
      onMatch={() => navigate({ to: ROUTES.deckMatch, params: { deckId } })}
      onTest={() => navigate({ to: ROUTES.deckQuestions, params: { deckId } })}
      onAddCard={() => navigate({ to: ROUTES.deckCardNew, params: { deckId } })}
      onEditCard={(cardId) => navigate({ to: ROUTES.deckCardEdit, params: { deckId, cardId } })}
      onPasteNotes={() => navigate({ to: ROUTES.deckPaste, params: { deckId } })}
      onReviewImport={() => navigate({ to: ROUTES.deckImport, params: { deckId } })}
    />
  )
}

export function DeckSettingsScreen({ deckId }: { deckId: string }) {
  const navigate = useNavigate()
  return (
    <DeckSettingsPage
      deckId={deckId}
      onBack={useBackToDeck(deckId)}
      onDeleted={() => navigate({ to: ROUTES.home })}
    />
  )
}

export function DeckAlgorithmScreen({ deckId }: { deckId: string }) {
  const navigate = useNavigate()
  return (
    <DeckAlgorithmPage
      deckId={deckId}
      onBack={useBack(() => void navigate({ to: ROUTES.deckSettings, params: { deckId } }))}
      onOpenAdvanced={() => navigate({ to: ROUTES.deckAlgorithmAdvanced, params: { deckId } })}
    />
  )
}

export function DeckAdvancedScreen({ deckId }: { deckId: string }) {
  const navigate = useNavigate()
  return (
    <DeckAdvancedPage
      deckId={deckId}
      onBack={useBack(() => void navigate({ to: ROUTES.deckAlgorithm, params: { deckId } }))}
    />
  )
}

export function DeckStudyScreen({ deckId }: { deckId: string }) {
  return <StudyCardsPage scope={{ kind: 'deck', deckId }} onBack={useBackToDeck(deckId)} />
}

export function DeckMatchScreen({ deckId }: { deckId: string }) {
  return <MatchPage scope={{ kind: 'deck', deckId }} onBack={useBackToDeck(deckId)} />
}

export function DeckQuizScreen({ deckId }: { deckId: string }) {
  return <QuizPage deckId={deckId} onBack={useBackToDeck(deckId)} />
}

export function DeckQuestionsScreen({ deckId }: { deckId: string }) {
  const navigate = useNavigate()
  return (
    <DeckQuestionsPage
      deckId={deckId}
      onBack={useBackToDeck(deckId)}
      onAddQuestion={() => navigate({ to: ROUTES.deckQuestionNew, params: { deckId } })}
      onEditQuestion={(questionId) =>
        navigate({ to: ROUTES.deckQuestionEdit, params: { deckId, questionId } })
      }
      onStartTest={() => navigate({ to: ROUTES.deckQuiz, params: { deckId } })}
    />
  )
}

export function QuestionEditorScreen({
  deckId,
  questionId,
}: {
  deckId: string
  questionId?: string
}) {
  const navigate = useNavigate()
  const toQuestions = () => void navigate({ to: ROUTES.deckQuestions, params: { deckId } })
  const back = useBack(toQuestions)
  return (
    <QuestionEditorPage
      deckId={deckId}
      questionId={questionId}
      onBack={back}
      onDone={toQuestions}
    />
  )
}

export function DeckPasteScreen({ deckId }: { deckId: string }) {
  const navigate = useNavigate()
  return (
    <PasteNotesPage
      onBack={useBackToDeck(deckId)}
      onReview={() => navigate({ to: ROUTES.deckImport, params: { deckId }, replace: true })}
    />
  )
}

export function NewPasteScreen() {
  const navigate = useNavigate()
  const deckStore = useDeckStoreApi()
  const decks = useDeckStore(selectDecks)
  const back = useBack(() => void navigate({ to: ROUTES.home }))
  const defaultName = nextDefaultName(
    'New Deck',
    decks.filter((d) => d.parentId === null && d.folderId === null).map((d) => d.name),
  )
  return (
    <PasteNotesPage
      newDeck
      defaultDeckName={defaultName}
      onBack={back}
      onReview={(name) =>
        void createDeck(deckStore, { name: name ?? defaultName }).then((deck) =>
          navigate({ to: ROUTES.deckImport, params: { deckId: deck.id }, replace: true }),
        )
      }
    />
  )
}

export function DeckImportScreen({ deckId }: { deckId: string }) {
  const navigate = useNavigate()
  const toDeck = () => void navigate({ to: ROUTES.deckDetail, params: { deckId }, replace: true })
  return <ImportReviewPage deckId={deckId} onBack={useBack(toDeck)} onDone={toDeck} />
}

export function CardEditorScreen({ deckId, cardId }: { deckId: string; cardId?: string }) {
  const navigate = useNavigate()
  return (
    <CardEditorPage
      deckId={deckId}
      cardId={cardId}
      onBack={useBackToDeck(deckId)}
      onNavigateCard={(id) =>
        navigate({ to: ROUTES.deckCardEdit, params: { deckId, cardId: id }, replace: true })
      }
    />
  )
}
