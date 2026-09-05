<script setup>
import { computed, ref } from 'vue'
import { useItemsStore } from '../stores/items'
import { CATEGORIES } from '../utils/constants'
import CategoryFilter from '../components/CategoryFilter.vue'
import ItemList from '../components/ItemList.vue'

const itemsStore = useItemsStore()

const selectedCategory = ref('')

const visibleItems = computed(() => {
  const items = selectedCategory.value
    ? itemsStore.items.filter((item) => item.category === selectedCategory.value)
    : itemsStore.items

  return [...items].sort((a, b) => {
    if (!a.expiryDate) return 1
    if (!b.expiryDate) return -1
    return a.expiryDate.localeCompare(b.expiryDate)
  })
})

function handleDelete(id) {
  itemsStore.deleteItem(id)
}
</script>

<template>
  <main class="refrigerator">
    <h1>我的冰箱</h1>
    <CategoryFilter v-model="selectedCategory" :categories="CATEGORIES" />
    <ItemList :items="visibleItems" @delete="handleDelete" />
    <RouterLink :to="{ name: 'item-new' }" class="fab" aria-label="新增物品">+</RouterLink>
  </main>
</template>

<style scoped>
.refrigerator {
  position: relative;
  padding: 16px;
  padding-bottom: 96px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.fab {
  position: fixed;
  right: 16px;
  bottom: 16px;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  font-size: 28px;
  line-height: 1;
  text-decoration: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

@media (min-width: 768px) {
  .refrigerator {
    padding: 32px;
    padding-bottom: 32px;
  }

  .fab {
    right: 32px;
    bottom: 32px;
  }
}
</style>
