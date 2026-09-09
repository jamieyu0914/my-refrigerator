import { supabase } from '../services/supabaseClient'

export async function getItems(userId) {
  const { data, error } = await supabase
    .from('recipes')
    .select('*, favorite_recipes(user_id)')
    .eq('favorite_recipes.user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getItemById(id, userId) {
  const { data, error } = await supabase
    .from('recipes')
    .select('*, recipe_ingredients(*), recipe_steps(*), favorite_recipes(user_id)')
    .eq('id', id)
    .eq('favorite_recipes.user_id', userId)
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

export async function deleteItem(id) {
  const { error } = await supabase.from('recipes').delete().eq('id', id)
  if (error) throw error
}

export async function deleteIngredients(recipeId) {
  const { error } = await supabase.from('recipe_ingredients').delete().eq('recipe_id', recipeId)
  if (error) throw error
}

export async function deleteSteps(recipeId) {
  const { error } = await supabase.from('recipe_steps').delete().eq('recipe_id', recipeId)
  if (error) throw error
}
