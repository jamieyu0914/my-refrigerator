import { supabase } from '../services/supabaseClient'

export async function getItems() {
  const { data, error } = await supabase
    .from('shopping_items')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export async function createItem(row) {
  const { data, error } = await supabase.from('shopping_items').insert(row).select().single()
  if (error) throw error
  return data
}

export async function updateItem(id, payload) {
  const { data, error } = await supabase
    .from('shopping_items')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteItem(id) {
  const { error } = await supabase.from('shopping_items').delete().eq('id', id)
  if (error) throw error
}
