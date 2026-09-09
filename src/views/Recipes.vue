<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRecipeStore } from '../stores/recipe'
import { matchesRecipeSearch } from '../utils/recipeSearch'
import RecipeList from '../components/RecipeList.vue'
import RecipeSearchInput from '../components/RecipeSearchInput.vue'

const recipeStore = useRecipeStore()

const isLoading = ref(true)
const errorMessage = ref('')
const togglingIds = ref([])
const searchQuery = ref('')

onMounted(async () => {
  try {
    await recipeStore.loadRecipes()
  } catch {
    errorMessage.value = '載入食譜失敗，請稍後再試。'
  } finally {
    isLoading.value = false
  }
})

const visibleRecipes = computed(() =>
  recipeStore.recipes.filter((recipe) => matchesRecipeSearch(recipe, searchQuery.value)),
)

const emptyMessage = computed(() =>
  searchQuery.value.trim()
    ? `找不到符合「${searchQuery.value.trim()}」的食譜`
    : '還沒有食譜，點右下角「+」新增一個吧！',
)

async function handleToggleFavorite(id) {
  if (togglingIds.value.includes(id)) return
  const recipe = recipeStore.recipes.find((r) => r.id === id)
  if (!recipe) return

  errorMessage.value = ''
  togglingIds.value.push(id)
  try {
    await recipeStore.toggleFavorite(id, recipe.isFavorite)
  } catch {
    errorMessage.value = '更新最愛狀態失敗，請稍後再試。'
  } finally {
    togglingIds.value = togglingIds.value.filter((togglingId) => togglingId !== id)
  }
}
</script>

<template>
  <main class="page">
    <h1>食譜</h1>
    <RecipeSearchInput v-model="searchQuery" />
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    <p v-if="isLoading" class="loading">載入中…</p>
    <RecipeList
      v-else
      :recipes="visibleRecipes"
      :toggling-ids="togglingIds"
      :empty-message="emptyMessage"
      @toggle-favorite="handleToggleFavorite"
    />
    <RouterLink :to="{ name: 'recipe-new' }" class="fab" aria-label="新增食譜">+</RouterLink>
  </main>
</template>

<style scoped>
.page {
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

.error {
  color: #c53232;
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
  .page {
    padding: 32px;
    padding-bottom: 32px;
  }

  .fab {
    right: 32px;
    bottom: 32px;
  }
}
</style>
