const TOKEN_KEY = 'refrigerator_auth_token'
const USER_KEY = 'refrigerator_auth_user'

export function loadSession() {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) return null
  return { user: JSON.parse(localStorage.getItem(USER_KEY) || 'null') }
}

// TODO: replace with a real API call once a backend exists
export function saveSession(user) {
  localStorage.setItem(TOKEN_KEY, 'demo-token')
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}
