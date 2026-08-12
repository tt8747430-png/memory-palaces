/** Anything carrying the client-written document clock the merges compare on. */
export interface Clocked {
  updatedAt: string
}

/**
 * Of two versions of a document, the one written later. Ties go to the first argument, which is
 * always the local side — a device should not be overruled by a write it cannot distinguish.
 */
export const newest = <T extends Clocked>(local: T, remote: T): T =>
  local.updatedAt >= remote.updatedAt ? local : remote
