<script setup>
import { useRouter } from 'vue-router'
import ExpiryBadge from './ExpiryBadge.vue'

const props = defineProps({
  food: { type: Object, required: true },
})

const emit = defineEmits(['delete'])

const router = useRouter()

function edit() {
  router.push({ name: 'food-edit', params: { id: props.food.id } })
}
</script>

<template>
  <article class="food-card">
    <button type="button" class="food-main" @click="edit">
      <div class="food-info">
        <h3>{{ food.name }}</h3>
        <p class="food-meta">{{ food.category }} · 數量 {{ food.quantity }}</p>
      </div>
      <ExpiryBadge :expiry-date="food.expiryDate" />
    </button>
    <button type="button" class="food-delete" aria-label="刪除" @click="emit('delete', food.id)">
      🗑
    </button>
  </article>
</template>

<style scoped>
.food-card {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 4px;
}

.food-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 44px;
  padding: 8px 12px;
  background: none;
  border: none;
  text-align: left;
  color: inherit;
  font: inherit;
}

.food-info h3 {
  margin: 0;
  font-size: 16px;
  color: var(--text-h);
}

.food-meta {
  margin: 2px 0 0;
  font-size: 13px;
  color: var(--text);
}

.food-delete {
  min-width: 44px;
  min-height: 44px;
  border: none;
  background: none;
  font-size: 18px;
  color: var(--text);
}
</style>
