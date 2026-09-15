import {
  type ImageRef,
  ObjectMissingError,
  parseObjectPath,
  type StoragePort,
  type Unsubscribe,
} from '@/shared/api'
import { isImageSettled, isInlineImage, markImageMissing, writeCachedImage } from '@/shared/lib'
import type { DeckStore } from '@/entities/deck'
import type { ProfileStore } from '@/entities/profile'

export interface KeepImagesCachedDeps {
  deckStore: DeckStore
  profileStore: ProfileStore
  storage: StoragePort
  target?: Pick<Window, 'addEventListener' | 'removeEventListener'>
}

function referenced({ deckStore, profileStore }: KeepImagesCachedDeps): ImageRef[] {
  const out: ImageRef[] = []
  const avatar = profileStore.getState().profile?.avatar
  if (avatar && !isInlineImage(avatar)) out.push({ bucket: 'avatars', path: avatar })
  for (const deck of deckStore.getState().decks) {
    if (deck.image && !isInlineImage(deck.image)) {
      out.push({ bucket: 'deck-images', path: deck.image })
    }
  }
  return out
}

export function keepImagesCached(deps: KeepImagesCachedDeps): Unsubscribe {
  const target = deps.target ?? window
  let running = false
  let again = false

  const fill = async () => {
    if (running) {
      again = true
      return
    }
    running = true
    try {
      for (const image of referenced(deps)) {
        if (await isImageSettled(image)) continue
        const ref = parseObjectPath(image)
        if (!ref) {
          await markImageMissing(image)
          continue
        }
        try {
          const response = await fetch(await deps.storage.signedUrl(ref))
          if (response.ok) await writeCachedImage(image, response)
          else if (response.status === 404) await markImageMissing(image)
        } catch (error) {
          if (error instanceof ObjectMissingError) await markImageMissing(image)
        }
      }
    } finally {
      running = false
      if (again) {
        again = false
        void fill()
      }
    }
  }

  const onChange = () => void fill()
  void fill()
  const unsubscribeDecks = deps.deckStore.subscribe(onChange)
  const unsubscribeProfile = deps.profileStore.subscribe(onChange)
  target.addEventListener('online', onChange)
  return () => {
    unsubscribeDecks()
    unsubscribeProfile()
    target.removeEventListener('online', onChange)
  }
}
