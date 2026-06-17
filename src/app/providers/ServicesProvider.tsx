import type { ReactNode } from 'react'
import { SessionStoreContext } from '@/entities/session'
import { PalaceStoreContext } from '@/entities/palace'
import { RoomStoreContext } from '@/entities/room'
import { LocusStoreContext } from '@/entities/locus'
import { QuestionStoreContext } from '@/entities/question'
import { ProgressStoreContext } from '@/entities/progress'
import { PreferencesStoreContext } from '@/entities/preferences'
import { ProfileStoreContext } from '@/entities/profile'
import { NotificationStoreContext } from '@/entities/notification'
import { AuthGatewayContext, EventBusContext } from '@/shared/lib'
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
    <AuthGatewayContext value={services.authGateway}>
      <SessionStoreContext value={services.sessionStore}>
        <PalaceStoreContext value={services.palaceStore}>
          <RoomStoreContext value={services.roomStore}>
            <LocusStoreContext value={services.locusStore}>
              <QuestionStoreContext value={services.questionStore}>
                <ProgressStoreContext value={services.progressStore}>
                  <PreferencesStoreContext value={services.preferencesStore}>
                    <ProfileStoreContext value={services.profileStore}>
                      <NotificationStoreContext value={services.notificationStore}>
                        <EventBusContext value={services.eventBus}>{children}</EventBusContext>
                      </NotificationStoreContext>
                    </ProfileStoreContext>
                  </PreferencesStoreContext>
                </ProgressStoreContext>
              </QuestionStoreContext>
            </LocusStoreContext>
          </RoomStoreContext>
        </PalaceStoreContext>
      </SessionStoreContext>
    </AuthGatewayContext>
  )
}
