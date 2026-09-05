import { getCurrentUserId, supabase } from './supabaseClient'

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
  const { data, error } = await supabase
    .from('foods')
    .select('*')
    .order('expiry_date', { ascending: true })

  if (error) throw error
  return data.map(toFood)
}

export async function fetchFoodById(id) {
  const { data, error } = await supabase.from('foods').select('*').eq('id', id).single()
  if (error) throw error
  return toFood(data)
}

export async function insertFood({ name, category, quantity, expiryDate }) {
  const userId = await getCurrentUserId()

  const { data, error } = await supabase
    .from('foods')
    .insert({
      user_id: userId,
      name,
      category_code: category,
      quantity,
      expiry_date: expiryDate || null,
    })
    .select()
    .single()

  if (error) throw error
  return toFood(data)
}

export async function updateFood(id, updates) {
  const payload = {}
  if ('name' in updates) payload.name = updates.name
  if ('category' in updates) payload.category_code = updates.category
  if ('quantity' in updates) payload.quantity = updates.quantity
  if ('expiryDate' in updates) payload.expiry_date = updates.expiryDate || null

  const { data, error } = await supabase
    .from('foods')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return toFood(data)
}

export async function deleteFood(id) {
  const { error } = await supabase.from('foods').delete().eq('id', id)
  if (error) throw error
}
