import type { ReactNode } from 'react'
import { SessionStoreContext } from '@/entities/session'
import { DeckStoreContext } from '@/entities/deck'
import { CardStoreContext } from '@/entities/card'
import { FolderStoreContext } from '@/entities/folder'
import { QuestionStoreContext } from '@/entities/question'
import { ProgressStoreContext } from '@/entities/progress'
import { PreferencesStoreContext } from '@/entities/preferences'
import { ProfileStoreContext } from '@/entities/profile'
import { NotificationStoreContext } from '@/entities/notification'
import { HistoryStoreContext } from '@/entities/learning-history'
import { PendingChangeStoreContext } from '@/entities/pending-change'
import { SyncStateStoreContext } from '@/entities/sync-state'
import {
  AccountDeletionContext,
  AuthGatewayContext,
  EventBusContext,
  ExtensionRepositoriesContext,
  ResetLocalDataContext,
  StoragePortContext,
} from '@/shared/lib'
import type { Services } from '../composition-root'

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
        <DeckStoreContext value={services.deckStore}>
          <CardStoreContext value={services.cardStore}>
            <FolderStoreContext value={services.folderStore}>
              <QuestionStoreContext value={services.questionStore}>
                <ProgressStoreContext value={services.progressStore}>
                  <PreferencesStoreContext value={services.preferencesStore}>
                    <ProfileStoreContext value={services.profileStore}>
                      <NotificationStoreContext value={services.notificationStore}>
                        <HistoryStoreContext value={services.historyStore}>
                          <PendingChangeStoreContext value={services.pendingChangeStore}>
                            <SyncStateStoreContext value={services.syncStateStore}>
                              <EventBusContext value={services.eventBus}>
                                <StoragePortContext value={services.storage}>
                                  <AccountDeletionContext value={services.accountDeletion}>
                                    <ResetLocalDataContext value={services.resetLocalData}>
                                      <ExtensionRepositoriesContext
                                        value={services.extensionRepositories}
                                      >
                                        {children}
                                      </ExtensionRepositoriesContext>
                                    </ResetLocalDataContext>
                                  </AccountDeletionContext>
                                </StoragePortContext>
                              </EventBusContext>
                            </SyncStateStoreContext>
                          </PendingChangeStoreContext>
                        </HistoryStoreContext>
                      </NotificationStoreContext>
                    </ProfileStoreContext>
                  </PreferencesStoreContext>
                </ProgressStoreContext>
              </QuestionStoreContext>
            </FolderStoreContext>
          </CardStoreContext>
        </DeckStoreContext>
      </SessionStoreContext>
    </AuthGatewayContext>
  )
}
