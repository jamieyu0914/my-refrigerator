<script setup>
import { useRouter } from 'vue-router'
import ExpiryBadge from './ExpiryBadge.vue'

const props = defineProps({
  item: { type: Object, required: true },
})

const emit = defineEmits(['delete'])

const router = useRouter()

function edit() {
  router.push({ name: 'item-edit', params: { id: props.item.id } })
}
</script>

<template>
  <article class="item-card">
    <button type="button" class="item-main" @click="edit">
      <div class="item-info">
        <h3>{{ item.name }}</h3>
        <p class="item-meta">{{ item.category }} · 數量 {{ item.quantity }}</p>
      </div>
      <ExpiryBadge :expiry-date="item.expiryDate" />
    </button>
    <button type="button" class="item-delete" aria-label="刪除" @click="emit('delete', item.id)">
      🗑
    </button>
  </article>
</template>

<style scoped>
.item-card {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 4px;
}

.item-main {
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

.item-info h3 {
  margin: 0;
  font-size: 16px;
  color: var(--text-h);
}

.item-meta {
  margin: 2px 0 0;
  font-size: 13px;
  color: var(--text);
}

.item-delete {
  min-width: 44px;
  min-height: 44px;
  border: none;
  background: none;
  font-size: 18px;
  color: var(--text);
}
</style>
