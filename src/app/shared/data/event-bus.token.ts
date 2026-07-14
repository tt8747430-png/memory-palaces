import { InjectionToken } from '@angular/core'
import { EventBus } from '@app/shared/domain'
import type { AppEvents } from '@app/shared/domain'

export const EVENT_BUS = new InjectionToken<EventBus<AppEvents>>('EVENT_BUS', {
  factory: () => new EventBus<AppEvents>(),
})
