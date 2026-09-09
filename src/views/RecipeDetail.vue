<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useRecipeStore } from '../stores/recipe'

const route = useRoute()
const recipeStore = useRecipeStore()

const recipe = ref(null)
const isLoading = ref(true)
const errorMessage = ref('')
const isTogglingFavorite = ref(false)

onMounted(async () => {
  try {
    recipe.value = await recipeStore.fetchRecipe(route.params.id)
  } catch {
    errorMessage.value = '載入食譜詳細內容失敗，請稍後再試。'
  } finally {
    isLoading.value = false
  }
})

async function handleToggleFavorite() {
  if (isTogglingFavorite.value || !recipe.value) return

  errorMessage.value = ''
  isTogglingFavorite.value = true
  try {
    recipe.value = await recipeStore.toggleFavorite(recipe.value.id, recipe.value.isFavorite)
  } catch {
    errorMessage.value = '更新最愛狀態失敗，請稍後再試。'
  } finally {
    isTogglingFavorite.value = false
  }
}
</script>

<template>
  <main class="page">
    <RouterLink :to="{ name: 'recipes' }" class="back">← 回食譜列表</RouterLink>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    <p v-if="isLoading" class="loading">載入中…</p>
    <article v-else-if="recipe" class="recipe">
      <img v-if="recipe.imageUrl" :src="recipe.imageUrl" :alt="recipe.title" class="cover" />
      <div class="heading">
        <h1>{{ recipe.title }}</h1>
        <button
          type="button"
          class="favorite"
          :aria-label="recipe.isFavorite ? '移除最愛' : '加入最愛'"
          :disabled="isTogglingFavorite"
          @click="handleToggleFavorite"
        >
          {{ recipe.isFavorite ? '★ 已收藏' : '☆ 加入最愛' }}
        </button>
      </div>
      <p v-if="recipe.cookTimeMinutes || recipe.difficulty" class="meta">
        <template v-if="recipe.cookTimeMinutes">⏱ {{ recipe.cookTimeMinutes }} 分鐘</template>
        <template v-if="recipe.cookTimeMinutes && recipe.difficulty"> · </template>
        <template v-if="recipe.difficulty">難度：{{ recipe.difficulty }}</template>
      </p>
      <p v-if="recipe.description" class="description">{{ recipe.description }}</p>
      <div v-if="recipe.tags.length" class="tags">
        <span v-for="tag in recipe.tags" :key="tag" class="tag">{{ tag }}</span>
      </div>
      <section>
        <h2>食材</h2>
        <ul class="ingredients">
          <li v-for="ingredient in recipe.ingredients" :key="ingredient.id">
            {{ ingredient.name }}<template v-if="ingredient.amount"> {{ ingredient.amount }}</template>
          </li>
        </ul>
      </section>
      <section>
        <h2>做法</h2>
        <ol class="steps">
          <li v-for="step in recipe.steps" :key="step.id">{{ step.description }}</li>
        </ol>
      </section>
    </article>
  </main>
</template>

<style scoped>
.page {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.back {
  color: var(--text);
  text-decoration: none;
}

.loading {
  color: var(--text);
}

.error {
  color: #c53232;
}

.recipe {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cover {
  width: 100%;
  max-height: 240px;
  object-fit: cover;
  border-radius: 12px;
}

.heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.heading h1 {
  margin: 0;
}

.favorite {
  min-height: 44px;
  padding: 0 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  color: var(--accent);
  font-size: 15px;
}

.favorite:disabled {
  opacity: 0.6;
}

.meta {
  margin: 0;
  color: var(--text);
  font-size: 14px;
}

.description {
  margin: 0;
  color: var(--text-h);
}

.tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tag {
  font-size: 12px;
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 2px 10px;
}

h2 {
  font-size: 16px;
  margin: 0 0 8px;
}

.ingredients {
  margin: 0;
  padding-left: 20px;
  color: var(--text);
}

.steps {
  margin: 0;
  padding-left: 20px;
  color: var(--text);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

@media (min-width: 768px) {
  .page {
    padding: 32px;
  }
}
</style>
