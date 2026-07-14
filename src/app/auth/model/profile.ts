import type { Entity } from '@app/shared/domain'

export interface Profile extends Entity {
  name: string
  username: string
  email: string
  bio: string
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

export type ProfileChanges = Partial<
  Pick<Profile, 'name' | 'username' | 'email' | 'bio' | 'avatar'>
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
