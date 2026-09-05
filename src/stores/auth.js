import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { clearSession, loadSession, saveSession } from '../services/authService'

export const useAuthStore = defineStore('auth', () => {
  const session = loadSession()
  const user = ref(session?.user || null)
  const isLoggedIn = computed(() => !!user.value)

  function login(username) {
    const nextUser = { name: username }
    saveSession(nextUser)
    user.value = nextUser
  }

  function logout() {
    clearSession()
    user.value = null
  }

  return { user, isLoggedIn, login, logout }
})
