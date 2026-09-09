<script setup>
import { computed, onMounted, ref } from 'vue'
import { useFoodStore } from '../stores/food'
import { CATEGORIES } from '../utils/constants'
import CategoryFilter from '../components/CategoryFilter.vue'
import FoodList from '../components/FoodList.vue'

const foodStore = useFoodStore()

const selectedCategory = ref('')
const isLoading = ref(true)

onMounted(async () => {
  await foodStore.loadFoods()
  isLoading.value = false
})

const visibleFoods = computed(() =>
  selectedCategory.value
    ? foodStore.foods.filter((food) => food.category === selectedCategory.value)
    : foodStore.foods,
)

function handleDelete(id) {
  foodStore.deleteFood(id)
}
</script>

<template>
  <main class="refrigerator">
    <h1>我的冰箱</h1>
    <CategoryFilter v-model="selectedCategory" :categories="CATEGORIES" />
    <p v-if="isLoading" class="loading">載入中…</p>
    <FoodList v-else :foods="visibleFoods" @delete="handleDelete" />
    <RouterLink :to="{ name: 'food-new' }" class="fab" aria-label="新增物品">+</RouterLink>
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

.loading {
  color: var(--text);
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
