import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  deleteRecipe as deleteRecipeRow,
  fetchRecipeById,
  fetchRecipes,
  insertRecipe,
  toggleFavorite as toggleFavoriteRecipe,
  updateRecipe as updateRecipeRow,
} from '../services/recipeService'

export const useRecipeStore = defineStore('recipe', () => {
  const recipes = ref([])

  async function loadRecipes() {
    recipes.value = await fetchRecipes()
  }

  async function addRecipe(payload) {
    const recipe = await insertRecipe(payload)
    recipes.value.push(recipe)
  }

  async function updateRecipe(id, updates) {
    const updated = await updateRecipeRow(id, updates)
    const index = recipes.value.findIndex((r) => r.id === id)
    if (index !== -1) recipes.value[index] = updated
    return updated
  }

  async function deleteRecipe(id) {
    await deleteRecipeRow(id)
    const index = recipes.value.findIndex((r) => r.id === id)
    if (index !== -1) recipes.value.splice(index, 1)
  }

  async function toggleFavorite(id, currentValue) {
    const updated = await toggleFavoriteRecipe(id, currentValue)
    const index = recipes.value.findIndex((r) => r.id === id)
    if (index !== -1) recipes.value[index] = updated
    return updated
  }

  function fetchRecipe(id) {
    return fetchRecipeById(id)
  }

  return {
    recipes,
    loadRecipes,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    toggleFavorite,
    fetchRecipe,
  }
})
