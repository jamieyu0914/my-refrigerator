import { supabase } from '../services/supabaseClient'

export async function getItems() {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getItemById(id) {
  const { data, error } = await supabase
    .from('recipes')
    .select('*, recipe_ingredients(*), recipe_steps(*)')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createItem(row) {
  const { data, error } = await supabase.from('recipes').insert(row).select().single()
  if (error) throw error
  return data
}

export async function createIngredients(rows) {
  if (rows.length === 0) return []
  const { data, error } = await supabase.from('recipe_ingredients').insert(rows).select()
  if (error) throw error
  return data
}

export async function createSteps(rows) {
  if (rows.length === 0) return []
  const { data, error } = await supabase.from('recipe_steps').insert(rows).select()
  if (error) throw error
  return data
}

export async function updateItem(id, payload) {
  const { data, error } = await supabase
    .from('recipes')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}
