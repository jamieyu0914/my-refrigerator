import { ref } from 'vue'
import { defineStore } from 'pinia'
import { loadFoods, saveFoods } from '../services/foodService'

export const useFoodStore = defineStore('food', () => {
  const foods = ref(loadFoods())

  function persist() {
    saveFoods(foods.value)
  }

  function addFood({ name, category, quantity, expiryDate }) {
    foods.value.push({
      id: crypto.randomUUID(),
      name,
      category,
      quantity,
      expiryDate: expiryDate || null,
      addedAt: new Date().toISOString(),
    })
    persist()
  }

  function updateFood(id, updates) {
    const food = foods.value.find((f) => f.id === id)
    if (!food) return
    Object.assign(food, updates)
    persist()
  }

  function deleteFood(id) {
    const index = foods.value.findIndex((f) => f.id === id)
    if (index === -1) return
    foods.value.splice(index, 1)
    persist()
  }

  function getFood(id) {
    return foods.value.find((f) => f.id === id) || null
  }

  return { foods, addFood, updateFood, deleteFood, getFood }
})
