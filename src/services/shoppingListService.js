const STORAGE_KEY = 'refrigerator_shopping_list'

// TODO: replace with real API calls once a backend exists
export function loadShoppingItems() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

export function saveShoppingItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}
