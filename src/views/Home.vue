<script setup>
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()

const sections = [
  { name: 'refrigerator', icon: '🧊', label: '我的冰箱', description: '查看冰箱裡的食材' },
  { name: 'shopping-list', icon: '🛒', label: '採買清單', description: '待買的食材清單' },
  { name: 'recipes', icon: '📖', label: '食譜', description: '瀏覽推薦食譜' },
  { name: 'favorites', icon: '❤️', label: '最愛食譜', description: '收藏的食譜' },
  { name: 'promotions', icon: '🏷️', label: '特價食材', description: '目前特價中的食材' },
]
</script>

<template>
  <main class="home">
    <h1>你好，{{ auth.user?.name }} 👋</h1>
    <div class="grid">
      <RouterLink
        v-for="section in sections"
        :key="section.name"
        :to="{ name: section.name }"
        class="card"
      >
        <span class="icon">{{ section.icon }}</span>
        <span class="label">{{ section.label }}</span>
        <span class="desc">{{ section.description }}</span>
      </RouterLink>
    </div>
  </main>
</template>

<style scoped>
.home {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 44px;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
}

.icon {
  font-size: 24px;
}

.label {
  font-weight: 600;
  color: var(--text-h);
}

.desc {
  font-size: 13px;
  color: var(--text);
}

@media (min-width: 768px) {
  .home {
    padding: 32px;
  }

  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
