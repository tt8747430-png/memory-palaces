import { SingletonDocStore } from '@/shared/data/singleton-doc-store'
import { Observable, derived } from '@/shared/data/observable'
import type { StoreStatus } from '@/shared/data/collection-store'
import type { Repository } from '@/shared/data'
import type { Session } from '../model/session'
import { DEFAULT_PROFILE } from '../model/profile'
import type { Profile } from '../model/profile'
import type { RxJsonSchema } from 'rxdb'

/** Auth session (Guest/Account) — live in memory, loaded once per app start. */
export class SessionStore {
  constructor(private readonly repo: Repository<Session>) {}

  private readonly _session = new Observable<Session | null>(null)
  private readonly _status = new Observable<StoreStatus>('idle')
  readonly session = this._session.asReadonly()
  readonly status = this._status.asReadonly()

  async load(): Promise<void> {
    this._status.set('loading')
    const all = await this.repo.getAll()
    this._session.set(all[0] ?? null)
    this._status.set('ready')
  }

  async set(session: Session): Promise<void> {
    const saved = await this.repo.save(session)
    this._session.set(saved)
    this._status.set('ready')
  }

  async clear(): Promise<void> {
    const current = this._session.get()
    if (current) await this.repo.remove(current.id)
    this._session.set(null)
    this._status.set('ready')
  }
}

export class ProfileStore extends SingletonDocStore<Profile> {
  readonly profile = this.value
  /** Stored profile, falling back to defaults before the first save. */
  readonly effective = derived(this.value, (profile) => profile ?? DEFAULT_PROFILE)

  constructor(repo: Repository<Profile>) {
    super(repo)
  }
}

export const profileSchema: RxJsonSchema<Profile> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
    name: { type: 'string' },
    username: { type: 'string' },
    email: { type: 'string' },
    bio: { type: 'string' },
    avatar: { type: ['string', 'null'] },
  },
  required: ['id', 'createdAt', 'updatedAt', 'name', 'username', 'email', 'bio', 'avatar'],
}
