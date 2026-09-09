import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  deleteFood as deleteFoodRow,
  fetchFoodById,
  fetchFoods,
  insertFood,
  updateFood as updateFoodRow,
} from '../services/foodService'

export const useFoodStore = defineStore('food', () => {
  const foods = ref([])

  async function loadFoods() {
    foods.value = await fetchFoods()
  }

  async function addFood(payload) {
    const food = await insertFood(payload)
    foods.value.push(food)
  }

  async function updateFood(id, updates) {
    const updated = await updateFoodRow(id, updates)
    const index = foods.value.findIndex((f) => f.id === id)
    if (index !== -1) foods.value[index] = updated
  }

  async function deleteFood(id) {
    await deleteFoodRow(id)
    const index = foods.value.findIndex((f) => f.id === id)
    if (index !== -1) foods.value.splice(index, 1)
  }

  function fetchFood(id) {
    return fetchFoodById(id)
  }

  return { foods, loadFoods, addFood, updateFood, deleteFood, fetchFood }
})
