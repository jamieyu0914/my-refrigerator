import { reactive, readonly } from 'vue'

const TOKEN_KEY = 'refrigerator_auth_token'
const USER_KEY = 'refrigerator_auth_user'

const state = reactive({
  isLoggedIn: !!localStorage.getItem(TOKEN_KEY),
  user: JSON.parse(localStorage.getItem(USER_KEY) || 'null'),
})

function login(username) {
  // TODO: replace with a real API call once a backend exists
  localStorage.setItem(TOKEN_KEY, 'demo-token')
  localStorage.setItem(USER_KEY, JSON.stringify({ name: username }))
  state.isLoggedIn = true
  state.user = { name: username }
}

function logout() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  state.isLoggedIn = false
  state.user = null
}

export function useAuth() {
  return {
    state: readonly(state),
    login,
    logout,
  }
}
