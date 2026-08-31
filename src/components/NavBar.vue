<script setup>
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { state, logout } = useAuth()

function handleLogout() {
  logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <header class="navbar">
    <span class="navbar-title">🧊 my-refrigerator</span>
    <button
      v-if="state.isLoggedIn"
      type="button"
      class="navbar-action"
      @click="handleLogout"
    >
      登出
    </button>
  </header>
</template>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}

.navbar-title {
  font-size: 18px;
  font-weight: 600;
}

.navbar-action {
  min-height: 44px;
  padding: 0 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  color: var(--text);
  font-size: 15px;
}

@media (min-width: 768px) {
  .navbar {
    padding: 16px 32px;
  }
}
</style>
