import { generatePath, useParams } from 'react-router'
import { ROUTES } from '@/shared/config/routes'
import { useBack } from '@/shared/lib'
import { MatchPage } from './match-page'

/** Thin routed wrapper; the deck hub is the canonical parent on a deep link. */
export default function MatchRoute() {
  const { deckId = '' } = useParams()
  const back = useBack(generatePath(ROUTES.deckDetail, { deckId }))

  return <MatchPage deckId={deckId} onBack={back} />
}
