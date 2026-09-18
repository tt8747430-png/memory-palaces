import { bibleManifest } from '@/extensions/bible'
import type { ExtensionManifest } from '@/shared/lib'

/**
 * Every extension this build knows about. The one core file that names them — everything
 * downstream reads contributions from context instead.
 */
export const EXTENSIONS: ExtensionManifest[] = [bibleManifest]
