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

const favoriteRecipes = computed(() => recipeStore.recipes.filter((recipe) => recipe.isFavorite))

const visibleFavoriteRecipes = computed(() =>
  favoriteRecipes.value.filter((recipe) => matchesRecipeSearch(recipe, searchQuery.value)),
)

const emptyMessage = computed(() =>
  searchQuery.value.trim()
    ? `找不到符合「${searchQuery.value.trim()}」的最愛食譜`
    : '還沒有最愛食譜，去食譜列表按 ♡ 收藏喜歡的食譜吧！',
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
    <h1>最愛食譜</h1>
    <RecipeSearchInput v-model="searchQuery" />
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    <p v-if="isLoading" class="loading">載入中…</p>
    <RecipeList
      v-else
      :recipes="visibleFavoriteRecipes"
      :toggling-ids="togglingIds"
      :empty-message="emptyMessage"
      @toggle-favorite="handleToggleFavorite"
    />
  </main>
</template>

<style scoped>
.page {
  padding: 16px;
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

@media (min-width: 768px) {
  .page {
    padding: 32px;
  }
}
</style>
