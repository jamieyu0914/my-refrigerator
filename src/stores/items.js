import { ref } from 'vue'
import { defineStore } from 'pinia'
import { loadItems, saveItems } from '../services/itemsService'

export const useItemsStore = defineStore('items', () => {
  const items = ref(loadItems())

  function persist() {
    saveItems(items.value)
  }

  function addItem({ name, category, quantity, expiryDate }) {
    items.value.push({
      id: crypto.randomUUID(),
      name,
      category,
      quantity,
      expiryDate: expiryDate || null,
      addedAt: new Date().toISOString(),
    })
    persist()
  }

  function updateItem(id, updates) {
    const item = items.value.find((i) => i.id === id)
    if (!item) return
    Object.assign(item, updates)
    persist()
  }

  function deleteItem(id) {
    const index = items.value.findIndex((i) => i.id === id)
    if (index === -1) return
    items.value.splice(index, 1)
    persist()
  }

  function getItem(id) {
    return items.value.find((i) => i.id === id) || null
  }

  return { items, addItem, updateItem, deleteItem, getItem }
})
