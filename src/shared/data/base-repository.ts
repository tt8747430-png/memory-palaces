export interface Identifiable {
  id: string
}

export type Unsubscribe = () => void

export interface Repository<T extends Identifiable> {
  getAll(): Promise<T[]>
  getById(id: string): Promise<T | null>
  save(entity: T): Promise<T>
  remove(id: string): Promise<void>
  observe(listener: (entities: T[]) => void): Unsubscribe
}
