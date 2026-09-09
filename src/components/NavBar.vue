<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const navLinks = [
  { name: 'home', label: '首頁' },
  { name: 'refrigerator', label: '我的冰箱' },
  { name: 'shopping-list', label: '採買清單' },
  { name: 'recipes', label: '食譜' },
  { name: 'favorites', label: '最愛食譜' },
  { name: 'promotions', label: '特價食材' },
]

async function handleLogout() {
  await auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <header class="navbar">
    <div class="navbar-top">
      <span class="navbar-title">🧊 my-refrigerator</span>
      <button
        v-if="auth.isLoggedIn"
        type="button"
        class="navbar-action"
        @click="handleLogout"
      >
        登出
      </button>
    </div>
    <nav v-if="auth.isLoggedIn" class="navbar-links">
      <RouterLink
        v-for="link in navLinks"
        :key="link.name"
        :to="{ name: link.name }"
        class="navbar-link"
        active-class="active"
      >
        {{ link.label }}
      </RouterLink>
    </nav>
  </header>
</template>

<style scoped>
.navbar {
  border-bottom: 1px solid var(--border);
}

.navbar-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
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

.navbar-links {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  padding: 0 12px 8px;
}

.navbar-link {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  min-height: 44px;
  padding: 0 14px;
  border-radius: 8px;
  color: var(--text);
  text-decoration: none;
  font-size: 14px;
  white-space: nowrap;
}

.navbar-link.active {
  background: var(--accent);
  color: #fff;
}

@media (min-width: 768px) {
  .navbar-top {
    padding: 16px 32px;
  }

  .navbar-links {
    padding: 0 32px 12px;
  }
}
</style>
