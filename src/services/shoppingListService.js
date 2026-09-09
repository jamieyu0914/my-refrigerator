import { getCurrentUserId } from './supabaseClient'
import {
  createItem,
  deleteItem,
  getItems,
  updateItem,
} from '../repositories/shoppingListRepository'

function toShoppingItem(row) {
  return {
    id: row.id,
    name: row.name,
    quantity: row.quantity,
    checked: row.checked,
    addedAt: row.added_at,
  }
}

export async function fetchShoppingItems() {
  const rows = await getItems()
  return rows.map(toShoppingItem)
}

export async function insertShoppingItem({ name, quantity }) {
  const userId = await getCurrentUserId()
  const row = await createItem({ user_id: userId, name, quantity })
  return toShoppingItem(row)
}

export async function updateShoppingItem(id, updates) {
  const payload = {}
  if ('name' in updates) payload.name = updates.name
  if ('quantity' in updates) payload.quantity = updates.quantity
  if ('checked' in updates) payload.checked = updates.checked

  const row = await updateItem(id, payload)
  return toShoppingItem(row)
}

export async function deleteShoppingItem(id) {
  await deleteItem(id)
}
