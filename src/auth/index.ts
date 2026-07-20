/**
 * The auth area's public API — model types, the session/profile stores, the
 * gateway port and its local adapter, and session restoration (ADR-0008).
 *
 * The sign-in/sign-up/sign-out commands are absent: they are reached through
 * `AuthActions`, which binds them to the gateway and stores. That service lives
 * in `ui/` and is imported directly by the pages that use it.
 */
export * from './model/session'
export * from './model/profile'
export * from './data/stores'
export * from './data/auth-gateway'
export * from './data/local-auth-gateway'
export * from './commands/restore-session'
export * from './commands/profile-index'
