<script setup>
import { useAuth } from '../composables/useAuth'

const { state } = useAuth()
</script>

<template>
  <main class="home">
    <h1>你好，{{ state.user?.name }} 👋</h1>
    <p>這裡會顯示冰箱裡的物品。</p>
  </main>
</template>

<style scoped>
.home {
  padding: 16px;
}

@media (min-width: 768px) {
  .home {
    padding: 32px;
  }
}
</style>
