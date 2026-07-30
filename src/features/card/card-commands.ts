import { type Card, type CardChanges, updateCard } from '@/entities/card'
import { collectionCommands } from '@/shared/lib'

const commands = collectionCommands<'cards', Card, CardChanges>('cards', {
  label: 'Card',
  update: updateCard,
})

export const requireCard = commands.require
export const editCard = commands.edit
export const deleteCard = commands.remove
export const reorderCards = commands.reorder
