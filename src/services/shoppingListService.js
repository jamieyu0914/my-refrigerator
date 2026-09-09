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
    unit: row.unit,
    category: row.category_code,
    purchased: row.purchased,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function fetchShoppingItems() {
  const rows = await getItems()
  return rows.map(toShoppingItem)
}

export async function insertShoppingItem({ name, quantity, unit, category }) {
  const userId = await getCurrentUserId()
  const row = await createItem({
    user_id: userId,
    name,
    quantity,
    unit: unit || null,
    category_code: category,
  })
  return toShoppingItem(row)
}

export async function updateShoppingItem(id, updates) {
  const payload = {}
  if ('name' in updates) payload.name = updates.name
  if ('quantity' in updates) payload.quantity = updates.quantity
  if ('unit' in updates) payload.unit = updates.unit || null
  if ('category' in updates) payload.category_code = updates.category
  if ('purchased' in updates) payload.purchased = updates.purchased

  const row = await updateItem(id, payload)
  return toShoppingItem(row)
}

export async function deleteShoppingItem(id) {
  await deleteItem(id)
}
