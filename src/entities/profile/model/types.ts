import type { Entity } from '@/shared/lib'

export interface Profile extends Entity {
  name: string
  username: string
  email: string
  bio: string
  phone: string
  avatar: string | null
}

export const DEFAULT_PROFILE = {
  name: '',
  username: '',
  email: '',
  bio: '',
  phone: '',
  avatar: null as string | null,
}

export interface MakeProfileInput {
  id: string
  createdAt: string
  name?: string
  username?: string
  email?: string
  bio?: string
  phone?: string
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
    phone: input.phone ?? DEFAULT_PROFILE.phone,
    avatar: input.avatar ?? DEFAULT_PROFILE.avatar,
  }
}

/**
 * A stored profile written before this version added a field carries the old shape: the RxDB
 * migration only rewrites documents already on this device, and one pulled from an account that a
 * second device last wrote is stored as it arrives. Fill the gaps, but keep `updatedAt` — that
 * clock decides sync conflicts, and completing a document is not an edit.
 */
export function completeProfile(profile: Profile): Profile {
  return { ...makeProfile(profile), updatedAt: profile.updatedAt }
}

export type ProfileChanges = Partial<
  Pick<Profile, 'name' | 'username' | 'email' | 'bio' | 'phone' | 'avatar'>
>

export function updateProfile(
  profile: Profile,
  changes: ProfileChanges,
  updatedAt: string,
): Profile {
  return { ...profile, ...changes, updatedAt }
}

export function profileInitials(profile: Pick<Profile, 'name' | 'email'>): string {
  const source = (profile.name.trim() || profile.email.trim()).trim()
  if (!source) return ''
  const words = source.split(/\s+/).filter(Boolean)
  const initials =
    words.length > 1 ? `${words[0]?.[0] ?? ''}${words[1]?.[0] ?? ''}` : source.slice(0, 2)
  return initials.toUpperCase()
}

export function profileHandle(profile: Pick<Profile, 'name' | 'username' | 'email'>): string {
  const local = profile.email.split('@')[0] ?? ''
  const source = profile.username || local || profile.name
  return source.toLowerCase().replace(/[^a-z0-9]+/g, '')
}
