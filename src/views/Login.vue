<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

async function handleSubmit() {
  if (!email.value.trim() || !password.value) return

  errorMessage.value = ''
  isSubmitting.value = true

  try {
    await auth.login(email.value.trim(), password.value)
    router.push(route.query.redirect || { name: 'home' })
  } catch {
    errorMessage.value = '登入失敗，請確認 Email 或密碼是否正確。'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="login">
    <form class="login-card" @submit.prevent="handleSubmit">
      <h1>登入</h1>
      <label class="field">
        <span>Email</span>
        <input
          v-model="email"
          type="email"
          placeholder="you@example.com"
          autocomplete="email"
          required
        />
      </label>
      <label class="field">
        <span>密碼</span>
        <input
          v-model="password"
          type="password"
          placeholder="輸入密碼"
          autocomplete="current-password"
          required
        />
      </label>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
      <button type="submit" class="submit" :disabled="isSubmitting">
        {{ isSubmitting ? '登入中…' : '登入' }}
      </button>
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

.error {
  margin: 0;
  color: #c53232;
  font-size: 14px;
}

.submit {
  min-height: 44px;
  border: none;
  border-radius: 8px;
  background: var(--accent);
  color: #fff;
  font-size: 16px;
}

.submit:disabled {
  opacity: 0.6;
}

@media (min-width: 768px) {
  .login {
    padding: 48px 16px;
  }
}
</style>
