import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  deleteShoppingItem,
  fetchShoppingItems,
  insertShoppingItem,
  updateShoppingItem,
} from '../services/shoppingListService'

export const useShoppingListStore = defineStore('shoppingList', () => {
  const items = ref([])

  async function loadItems() {
    items.value = await fetchShoppingItems()
  }

  async function addItem(payload) {
    const item = await insertShoppingItem(payload)
    items.value.push(item)
  }

  async function toggleChecked(id) {
    const item = items.value.find((i) => i.id === id)
    if (!item) return
    const updated = await updateShoppingItem(id, { checked: !item.checked })
    Object.assign(item, updated)
  }

  async function deleteItem(id) {
    await deleteShoppingItem(id)
    const index = items.value.findIndex((i) => i.id === id)
    if (index !== -1) items.value.splice(index, 1)
  }

  return { items, loadItems, addItem, toggleChecked, deleteItem }
})
