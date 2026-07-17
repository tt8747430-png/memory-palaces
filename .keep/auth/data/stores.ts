import { Inject, Injectable, InjectionToken, computed, signal } from '@angular/core'
import { SingletonDocStore } from '@app/shared/data/singleton-doc-store'
import type { StoreStatus } from '@app/shared/data/collection-store'
import type { Repository } from '@app/shared/data'
import type { AuthGateway } from './auth-gateway'
import type { Session } from '../model/session'
import { DEFAULT_PROFILE } from '../model/profile'
import type { Profile } from '../model/profile'
import type { RxJsonSchema } from 'rxdb'

export const SESSION_REPOSITORY = new InjectionToken<Repository<Session>>('SESSION_REPOSITORY')
export const PROFILE_REPOSITORY = new InjectionToken<Repository<Profile>>('PROFILE_REPOSITORY')
export const AUTH_GATEWAY = new InjectionToken<AuthGateway>('AUTH_GATEWAY')

/** Auth session (Guest/Account) — live in memory, loaded once per app start. */
@Injectable({ providedIn: 'root' })
export class SessionStore {
  // eslint-disable-next-line @angular-eslint/prefer-inject -- constructor param keeps the store directly constructible in unit tests (new XStore(repo))
  constructor(@Inject(SESSION_REPOSITORY) private readonly repo: Repository<Session>) {}

  private readonly _session = signal<Session | null>(null)
  private readonly _status = signal<StoreStatus>('idle')
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
    const current = this._session()
    if (current) await this.repo.remove(current.id)
    this._session.set(null)
    this._status.set('ready')
  }
}

@Injectable({ providedIn: 'root' })
export class ProfileStore extends SingletonDocStore<Profile> {
  readonly profile = this.value
  /** Stored profile, falling back to defaults before the first save. */
  readonly effective = computed(() => this.value() ?? DEFAULT_PROFILE)

  // eslint-disable-next-line @angular-eslint/prefer-inject -- constructor param keeps the store directly constructible in unit tests (new XStore(repo))
  constructor(@Inject(PROFILE_REPOSITORY) repo: Repository<Profile>) {
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
