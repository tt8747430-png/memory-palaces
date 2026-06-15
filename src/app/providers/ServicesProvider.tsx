import type { ReactNode } from 'react'
import { SessionStoreContext } from '@/entities/session'
import { PalaceStoreContext } from '@/entities/palace'
import { RoomStoreContext } from '@/entities/room'
import { LocusStoreContext } from '@/entities/locus'
import type { Services } from '../composition-root'

/** Injects composition-root services into the React tree (entity store contexts). */
export function ServicesProvider({
  services,
  children,
}: {
  services: Services
  children: ReactNode
}) {
  return (
    <SessionStoreContext value={services.sessionStore}>
      <PalaceStoreContext value={services.palaceStore}>
        <RoomStoreContext value={services.roomStore}>
          <LocusStoreContext value={services.locusStore}>{children}</LocusStoreContext>
        </RoomStoreContext>
      </PalaceStoreContext>
    </SessionStoreContext>
  )
}
