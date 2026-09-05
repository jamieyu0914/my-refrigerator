<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const username = ref('')
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

function handleSubmit() {
  if (!username.value.trim()) return
  auth.login(username.value.trim())
  router.push(route.query.redirect || { name: 'home' })
}
</script>

<template>
  <main class="login">
    <form class="login-card" @submit.prevent="handleSubmit">
      <h1>登入</h1>
      <label class="field">
        <span>使用者名稱</span>
        <input v-model="username" type="text" placeholder="輸入使用者名稱" autocomplete="username" />
      </label>
      <button type="submit" class="submit">登入</button>
    </form>
  </main>
</template>

<style scoped>
.login {
  display: flex;
  justify-content: center;
  padding: 24px 16px;
}

.login-card {
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
}

.field input {
  min-height: 44px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 16px;
}

.submit {
  min-height: 44px;
  border: none;
  border-radius: 8px;
  background: var(--accent);
  color: #fff;
  font-size: 16px;
}

@media (min-width: 768px) {
  .login {
    padding: 48px 16px;
  }
}
</style>
