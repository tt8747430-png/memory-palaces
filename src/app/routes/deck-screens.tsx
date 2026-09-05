import { useNavigate, useParams } from '@tanstack/react-router'
import { CardEditorPage } from '@/pages/card-editor'
import { DeckDetailPage } from '@/pages/deck-detail'
import { DeckQuestionsPage } from '@/pages/deck-questions'
import { DeckAdvancedPage, DeckAlgorithmPage } from '@/pages/deck-algorithm'
import { DeckCardStylePage } from '@/pages/deck-card-style'
import { DeckSettingsPage } from '@/pages/deck-settings'
import { DeckTtsPage } from '@/pages/deck-tts'
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

/**
 * Screens read their own params rather than taking them as props from `router.tsx`. That is what
 * lets every route in this module be a `lazyRouteComponent`: the router file no longer has to
 * import a screen in order to hand it a param, so none of this module is in the entry chunk.
 */
function useDeckId(from: (typeof ROUTES)[keyof typeof ROUTES]) {
  return useParams({ from, select: (params) => (params as { deckId: string }).deckId })
}

function useBackToDeck(deckId: string, replace = false) {
  const navigate = useNavigate()
  return useBack(() => void navigate({ to: ROUTES.deckDetail, params: { deckId }, replace }))
}

export function DeckDetailScreen() {
  const deckId = useDeckId(ROUTES.deckDetail)
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

export function DeckSettingsScreen() {
  const deckId = useDeckId(ROUTES.deckSettings)
  const navigate = useNavigate()
  return (
    <DeckSettingsPage
      deckId={deckId}
      onBack={useBackToDeck(deckId)}
      onDeleted={() => navigate({ to: ROUTES.home })}
      onArchived={() => navigate({ to: ROUTES.home })}
      onOpenAlgorithm={() => navigate({ to: ROUTES.deckAlgorithm, params: { deckId } })}
      onOpenCardStyle={() => navigate({ to: ROUTES.deckCardStyle, params: { deckId } })}
      onOpenTts={() => navigate({ to: ROUTES.deckTts, params: { deckId } })}
      onPasteNotes={() => navigate({ to: ROUTES.deckPaste, params: { deckId } })}
      onReviewImport={() => navigate({ to: ROUTES.deckImport, params: { deckId } })}
    />
  )
}

export function DeckAlgorithmScreen() {
  const deckId = useDeckId(ROUTES.deckAlgorithm)
  const navigate = useNavigate()
  return (
    <DeckAlgorithmPage
      deckId={deckId}
      onBack={useBack(() => void navigate({ to: ROUTES.deckSettings, params: { deckId } }))}
      onOpenAdvanced={() => navigate({ to: ROUTES.deckAlgorithmAdvanced, params: { deckId } })}
    />
  )
}

export function DeckAdvancedScreen() {
  const deckId = useDeckId(ROUTES.deckAlgorithmAdvanced)
  const navigate = useNavigate()
  return (
    <DeckAdvancedPage
      deckId={deckId}
      onBack={useBack(() => void navigate({ to: ROUTES.deckAlgorithm, params: { deckId } }))}
    />
  )
}

export function DeckCardStyleScreen() {
  const deckId = useDeckId(ROUTES.deckCardStyle)
  const navigate = useNavigate()
  return (
    <DeckCardStylePage
      deckId={deckId}
      onBack={useBack(() => void navigate({ to: ROUTES.deckSettings, params: { deckId } }))}
    />
  )
}

export function DeckTtsScreen() {
  const deckId = useDeckId(ROUTES.deckTts)
  const navigate = useNavigate()
  return (
    <DeckTtsPage
      deckId={deckId}
      onBack={useBack(() => void navigate({ to: ROUTES.deckSettings, params: { deckId } }))}
    />
  )
}

export function DeckStudyScreen() {
  const deckId = useDeckId(ROUTES.deckStudy)
  return <StudyCardsPage scope={{ kind: 'deck', deckId }} onBack={useBackToDeck(deckId)} />
}

export function DeckMatchScreen() {
  const deckId = useDeckId(ROUTES.deckMatch)
  return <MatchPage scope={{ kind: 'deck', deckId }} onBack={useBackToDeck(deckId)} />
}

export function DeckQuizScreen() {
  const deckId = useDeckId(ROUTES.deckQuiz)
  return <QuizPage deckId={deckId} onBack={useBackToDeck(deckId)} />
}

export function DeckQuestionsScreen() {
  const deckId = useDeckId(ROUTES.deckQuestions)
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

function QuestionEditor({ deckId, questionId }: { deckId: string; questionId?: string }) {
  const navigate = useNavigate()
  const toQuestions = () => void navigate({ to: ROUTES.deckQuestions, params: { deckId } })
  return (
    <QuestionEditorPage
      deckId={deckId}
      questionId={questionId}
      onBack={useBack(toQuestions)}
      onDone={toQuestions}
    />
  )
}

export function QuestionNewScreen() {
  return <QuestionEditor deckId={useDeckId(ROUTES.deckQuestionNew)} />
}

export function QuestionEditScreen() {
  const { deckId, questionId } = useParams({ from: ROUTES.deckQuestionEdit })
  return <QuestionEditor deckId={deckId} questionId={questionId} />
}

export function DeckPasteScreen() {
  const deckId = useDeckId(ROUTES.deckPaste)
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

export function DeckImportScreen() {
  const deckId = useDeckId(ROUTES.deckImport)
  const navigate = useNavigate()
  const toDeck = () => void navigate({ to: ROUTES.deckDetail, params: { deckId }, replace: true })
  return <ImportReviewPage deckId={deckId} onBack={useBack(toDeck)} onDone={toDeck} />
}

function CardEditor({ deckId, cardId }: { deckId: string; cardId?: string }) {
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

export function CardNewScreen() {
  return <CardEditor deckId={useDeckId(ROUTES.deckCardNew)} />
}

export function CardEditScreen() {
  const { deckId, cardId } = useParams({ from: ROUTES.deckCardEdit })
  return <CardEditor deckId={deckId} cardId={cardId} />
}
