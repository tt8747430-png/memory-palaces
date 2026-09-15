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
  /** Injected so a test can drive a reconnect. */
  target?: Pick<Window, 'addEventListener' | 'removeEventListener'>
}

/** Every image a document points at, as the cache keys it. */
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

/**
 * Fills the device's image cache for every path a document points at.
 *
 * The buckets are private, so bytes need a signed URL — and minting one during render would break
 * the rule MOBILE_DESIGN fixes: "reads never touch the network. Never block UI on a round-trip." So
 * the fetch happens here, ahead of the read, and `useImageSrc` looks only at what this leaves.
 *
 * It runs at start, whenever the two stores change, and on every reconnect — "later" has to include
 * the moment the network comes back, or an image referenced while offline would wait for an
 * unrelated edit. An object storage says does not exist is recorded as missing, so the reader shows
 * `unavailable` instead of waiting forever; an unreachable one is simply tried again next time.
 */
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
          // Anything else is the network. The next change or reconnect tries again.
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
