import { useNavigate } from '@tanstack/react-router'
import { useBack } from '@/shared/lib'
import { BIBLE_PATHS } from '../ids'
import { BibleDeveloperPage } from './BibleDeveloperPage'

/** Reached from the overview and nowhere else, so that is where a cold link goes back to. */
export function BibleDeveloperScreen() {
  const navigate = useNavigate()
  const back = useBack(() => void navigate({ to: BIBLE_PATHS.overview }))
  return <BibleDeveloperPage onBack={back} />
}
