import type { Entity } from '@/shared/lib'

/**
 * The learner's account profile — one singleton record. Local-only for now
 * (persisted through the repository port); a real account/sync lands in Phase 9
 * by swapping the adapter, with this shape and the write-path command unchanged.
 */
export interface Profile extends Entity {
  name: string
  /** The learner's chosen @handle. Local-only, not unique (no backend to enforce it). */
  username: string
  email: string
  bio: string
  /** Square JPEG data-URL (~256px), or null to fall back to initials. */
  avatar: string | null
}

export const DEFAULT_PROFILE = {
  name: '',
  username: '',
  email: '',
  bio: '',
  avatar: null as string | null,
}

export interface MakeProfileInput {
  id: string
  createdAt: string
  name?: string
  username?: string
  email?: string
  bio?: string
  avatar?: string | null
}

export function makeProfile(input: MakeProfileInput): Profile {
  return {
    id: input.id,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
    name: input.name ?? DEFAULT_PROFILE.name,
    username: input.username ?? DEFAULT_PROFILE.username,
    email: input.email ?? DEFAULT_PROFILE.email,
    bio: input.bio ?? DEFAULT_PROFILE.bio,
    avatar: input.avatar ?? DEFAULT_PROFILE.avatar,
  }
}

/** The editable fields — identity and timestamps are owned elsewhere. */
export type ProfileChanges = Partial<
  Pick<Profile, 'name' | 'username' | 'email' | 'bio' | 'avatar'>
>

/** Apply a change. `updatedAt` is set by the caller (clock injected) so it stays pure. */
export function updateProfile(
  profile: Profile,
  changes: ProfileChanges,
  updatedAt: string,
): Profile {
  return { ...profile, ...changes, updatedAt }
}

/** Two-letter avatar fallback: the name's initials, or the email's, else empty. */
export function profileInitials(profile: Pick<Profile, 'name' | 'email'>): string {
  const source = (profile.name.trim() || profile.email.trim()).trim()
  if (!source) return ''
  const words = source.split(/\s+/).filter(Boolean)
  const initials =
    words.length > 1 ? `${words[0]?.[0] ?? ''}${words[1]?.[0] ?? ''}` : source.slice(0, 2)
  return initials.toUpperCase()
}

/** A display handle: the chosen username, else the email local part, else the name. */
export function profileHandle(profile: Pick<Profile, 'name' | 'username' | 'email'>): string {
  const local = profile.email.split('@')[0] ?? ''
  const source = profile.username || local || profile.name
  return source.toLowerCase().replace(/[^a-z0-9]+/g, '')
}
