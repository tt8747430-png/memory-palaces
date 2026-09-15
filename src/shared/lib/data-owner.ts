const OWNER_KEY = 'mindscape:data-owner'

export interface DataOwner {
  read(): string | null
  claim(userId: string): void
}

export const localDataOwner: DataOwner = {
  read: () => localStorage.getItem(OWNER_KEY),
  claim: (userId) => localStorage.setItem(OWNER_KEY, userId),
}
