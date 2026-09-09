import { supabase } from '../services/supabaseClient'

export async function createFavorite(row) {
  const { error } = await supabase.from('favorite_recipes').insert(row)
  if (error) throw error
}

export async function deleteFavorite(userId, recipeId) {
  const { error } = await supabase
    .from('favorite_recipes')
    .delete()
    .eq('user_id', userId)
    .eq('recipe_id', recipeId)

  if (error) throw error
}
