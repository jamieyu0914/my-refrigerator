import { ref } from 'vue'
import { defineStore } from 'pinia'
import { loadShoppingItems, saveShoppingItems } from '../services/shoppingListService'

export const useShoppingListStore = defineStore('shoppingList', () => {
  const items = ref(loadShoppingItems())

  function persist() {
    saveShoppingItems(items.value)
  }

  function addItem({ name, quantity }) {
    items.value.push({
      id: crypto.randomUUID(),
      name,
      quantity,
      checked: false,
      addedAt: new Date().toISOString(),
    })
    persist()
  }

  function toggleChecked(id) {
    const item = items.value.find((i) => i.id === id)
    if (!item) return
    item.checked = !item.checked
    persist()
  }

  function deleteItem(id) {
    const index = items.value.findIndex((i) => i.id === id)
    if (index === -1) return
    items.value.splice(index, 1)
    persist()
  }

  return { items, addItem, toggleChecked, deleteItem }
})
