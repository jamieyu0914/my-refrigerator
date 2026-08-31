import { reactive, readonly } from 'vue'

const STORAGE_KEY = 'refrigerator_items'

export const CATEGORIES = ['蔬果', '肉類', '乳製品', '飲品', '其他']

function loadItems() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

const state = reactive({
  items: loadItems(),
})

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items))
}

// TODO: replace with real API calls once a backend exists
function addItem({ name, category, quantity, expiryDate }) {
  state.items.push({
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
  const item = state.items.find((i) => i.id === id)
  if (!item) return
  Object.assign(item, updates)
  persist()
}

function deleteItem(id) {
  const index = state.items.findIndex((i) => i.id === id)
  if (index === -1) return
  state.items.splice(index, 1)
  persist()
}

function getItem(id) {
  return state.items.find((i) => i.id === id) || null
}

export function useItems() {
  return {
    state: readonly(state),
    addItem,
    updateItem,
    deleteItem,
    getItem,
  }
}
