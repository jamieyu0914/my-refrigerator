import { getCurrentUserId, supabase } from './supabaseClient'

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
  const { data, error } = await supabase
    .from('shopping_items')
    .select('*')
    .order('added_at', { ascending: true })

  if (error) throw error
  return data.map(toShoppingItem)
}

export async function insertShoppingItem({ name, quantity }) {
  const userId = await getCurrentUserId()

  const { data, error } = await supabase
    .from('shopping_items')
    .insert({ user_id: userId, name, quantity })
    .select()
    .single()

  if (error) throw error
  return toShoppingItem(data)
}

export async function updateShoppingItem(id, updates) {
  const payload = {}
  if ('name' in updates) payload.name = updates.name
  if ('quantity' in updates) payload.quantity = updates.quantity
  if ('checked' in updates) payload.checked = updates.checked

  const { data, error } = await supabase
    .from('shopping_items')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return toShoppingItem(data)
}

export async function deleteShoppingItem(id) {
  const { error } = await supabase.from('shopping_items').delete().eq('id', id)
  if (error) throw error
}
