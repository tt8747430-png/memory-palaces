import { Folder, Layers, WalletCards } from 'lucide-react'
import type { SwipeItemType } from '@/shared/config/swipe'

/** The glyph for each kind of row a swipe is configured on — the tab and the sample row share it. */
export const SWIPE_TYPE_ICON: Record<SwipeItemType, typeof Layers> = {
  deck: Layers,
  folder: Folder,
  card: WalletCards,
}
