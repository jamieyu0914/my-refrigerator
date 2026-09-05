const STORAGE_KEY = 'refrigerator_foods'

// TODO: replace with real API calls once a backend exists
export function loadFoods() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

export function saveFoods(foods) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(foods))
}
