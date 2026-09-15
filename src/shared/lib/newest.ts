export interface Clocked {
  updatedAt: string
}

export const newest = <T extends Clocked>(local: T, remote: T): T =>
  local.updatedAt >= remote.updatedAt ? local : remote
