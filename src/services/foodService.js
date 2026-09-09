import { getCurrentUserId } from './supabaseClient'
import {
  createItem,
  deleteItem,
  getItemById,
  getItems,
  updateItem,
} from '../repositories/refrigeratorRepository'

function toFood(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category_code,
    quantity: row.quantity,
    expiryDate: row.expiry_date,
    addedAt: row.added_at,
  }
}

export async function fetchFoods() {
  const rows = await getItems()
  return rows.map(toFood)
}

export async function fetchFoodById(id) {
  const row = await getItemById(id)
  return toFood(row)
}

export async function insertFood({ name, category, quantity, expiryDate }) {
  const userId = await getCurrentUserId()

  const row = await createItem({
    user_id: userId,
    name,
    category_code: category,
    quantity,
    expiry_date: expiryDate || null,
  })

  return toFood(row)
}

export async function updateFood(id, updates) {
  const payload = {}
  if ('name' in updates) payload.name = updates.name
  if ('category' in updates) payload.category_code = updates.category
  if ('quantity' in updates) payload.quantity = updates.quantity
  if ('expiryDate' in updates) payload.expiry_date = updates.expiryDate || null

  const row = await updateItem(id, payload)
  return toFood(row)
}

export async function deleteFood(id) {
  await deleteItem(id)
}
