const STORAGE_KEY = 'refrigerator_items'

// TODO: replace with real API calls once a backend exists
export function loadItems() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

export function saveItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}
