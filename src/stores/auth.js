import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { getSession, onAuthStateChange, signIn, signOut } from '../services/authService'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const isLoggedIn = computed(() => !!user.value)

  async function init() {
    user.value = await getSession()

    onAuthStateChange((session) => {
      if (!session) user.value = null
    })
  }

  async function login(email, password) {
    user.value = await signIn(email, password)
  }

  async function logout() {
    await signOut()
    user.value = null
  }

  return { user, isLoggedIn, init, login, logout }
})
