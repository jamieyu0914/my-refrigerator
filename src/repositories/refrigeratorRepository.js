import { supabase } from '../services/supabaseClient'

export async function getItems() {
  const { data, error } = await supabase
    .from('foods')
    .select('*')
    .order('expiry_date', { ascending: true })

  if (error) throw error
  return data
}

export async function getItemById(id) {
  const { data, error } = await supabase.from('foods').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function createItem(row) {
  const { data, error } = await supabase.from('foods').insert(row).select().single()
  if (error) throw error
  return data
}

export async function updateItem(id, payload) {
  const { data, error } = await supabase
    .from('foods')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteItem(id) {
  const { error } = await supabase.from('foods').delete().eq('id', id)
  if (error) throw error
}
