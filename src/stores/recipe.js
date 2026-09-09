import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  fetchRecipeById,
  fetchRecipes,
  insertRecipe,
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

  function toggleFavorite(id, currentValue) {
    return updateRecipe(id, { isFavorite: !currentValue })
  }

  function fetchRecipe(id) {
    return fetchRecipeById(id)
  }

  return { recipes, loadRecipes, addRecipe, updateRecipe, toggleFavorite, fetchRecipe }
})
