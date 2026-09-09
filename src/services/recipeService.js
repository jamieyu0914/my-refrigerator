import { getCurrentUserId } from './supabaseClient'
import {
  createIngredients,
  createItem,
  createSteps,
  deleteIngredients,
  deleteItem,
  deleteSteps,
  getItemById,
  getItems,
  updateItem,
} from '../repositories/recipeRepository'
import { createFavorite, deleteFavorite } from '../repositories/favoriteRecipeRepository'

function toIngredient(row) {
  return {
    id: row.id,
    name: row.name,
    amount: row.amount,
    sortOrder: row.sort_order,
  }
}

function toStep(row) {
  return {
    id: row.id,
    description: row.description,
    sortOrder: row.sort_order,
  }
}

function toRecipe(row, userId) {
  const recipe = {
    id: row.id,
    title: row.title,
    imageUrl: row.image_url,
    cookTimeMinutes: row.cook_time_minutes,
    difficulty: row.difficulty,
    description: row.description,
    tags: row.tags,
    isFavorite: (row.favorite_recipes ?? []).length > 0,
    isOwn: row.user_id === userId,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }

  if (row.recipe_ingredients) {
    recipe.ingredients = [...row.recipe_ingredients]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(toIngredient)
  }

  if (row.recipe_steps) {
    recipe.steps = [...row.recipe_steps]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(toStep)
  }

  return recipe
}

export async function fetchRecipes() {
  const userId = await getCurrentUserId()
  const rows = await getItems(userId)
  return rows.map((row) => toRecipe(row, userId))
}

export async function fetchRecipeById(id) {
  const userId = await getCurrentUserId()
  const row = await getItemById(id, userId)
  return toRecipe(row, userId)
}

export async function insertRecipe({
  title,
  imageUrl,
  cookTimeMinutes,
  difficulty,
  description,
  tags,
  ingredients,
  steps,
}) {
  const userId = await getCurrentUserId()

  const row = await createItem({
    user_id: userId,
    title,
    image_url: imageUrl || null,
    cook_time_minutes: cookTimeMinutes,
    difficulty,
    description,
    tags,
  })

  await createIngredients(
    ingredients.map((ingredient, index) => ({
      recipe_id: row.id,
      name: ingredient.name,
      amount: ingredient.amount || null,
      sort_order: index,
    })),
  )

  await createSteps(
    steps.map((step, index) => ({
      recipe_id: row.id,
      description: step.description,
      sort_order: index,
    })),
  )

  return fetchRecipeById(row.id)
}

export async function updateRecipe(id, updates) {
  const payload = {}
  if ('title' in updates) payload.title = updates.title
  if ('imageUrl' in updates) payload.image_url = updates.imageUrl || null
  if ('cookTimeMinutes' in updates) payload.cook_time_minutes = updates.cookTimeMinutes
  if ('difficulty' in updates) payload.difficulty = updates.difficulty
  if ('description' in updates) payload.description = updates.description
  if ('tags' in updates) payload.tags = updates.tags

  if (Object.keys(payload).length > 0) {
    await updateItem(id, payload)
  }

  if ('ingredients' in updates) {
    await deleteIngredients(id)
    await createIngredients(
      updates.ingredients.map((ingredient, index) => ({
        recipe_id: id,
        name: ingredient.name,
        amount: ingredient.amount || null,
        sort_order: index,
      })),
    )
  }

  if ('steps' in updates) {
    await deleteSteps(id)
    await createSteps(
      updates.steps.map((step, index) => ({
        recipe_id: id,
        description: step.description,
        sort_order: index,
      })),
    )
  }

  return fetchRecipeById(id)
}

export async function deleteRecipe(id) {
  await deleteItem(id)
}

export async function toggleFavorite(recipeId, currentValue) {
  const userId = await getCurrentUserId()

  if (currentValue) {
    await deleteFavorite(userId, recipeId)
  } else {
    await createFavorite({ user_id: userId, recipe_id: recipeId })
  }

  return fetchRecipeById(recipeId)
}
