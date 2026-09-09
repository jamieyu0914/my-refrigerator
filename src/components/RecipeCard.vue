<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  recipe: { type: Object, required: true },
  toggling: { type: Boolean, default: false },
})

const emit = defineEmits(['toggle-favorite'])

const router = useRouter()

function openDetail() {
  router.push({ name: 'recipe-detail', params: { id: props.recipe.id } })
}
</script>

<template>
  <article class="recipe-card">
    <button type="button" class="recipe-main" @click="openDetail">
      <span class="recipe-thumb">
        <img v-if="recipe.imageUrl" :src="recipe.imageUrl" :alt="recipe.title" />
        <span v-else class="recipe-thumb-fallback">🍲</span>
      </span>
      <span class="recipe-info">
        <h3>{{ recipe.title }}</h3>
        <span v-if="recipe.cookTimeMinutes || recipe.difficulty" class="recipe-meta">
          <template v-if="recipe.cookTimeMinutes">⏱ {{ recipe.cookTimeMinutes }} 分鐘</template>
          <template v-if="recipe.cookTimeMinutes && recipe.difficulty"> · </template>
          <template v-if="recipe.difficulty">難度：{{ recipe.difficulty }}</template>
        </span>
        <span v-if="recipe.tags.length" class="recipe-tags">
          <span v-for="tag in recipe.tags" :key="tag" class="tag">{{ tag }}</span>
        </span>
      </span>
    </button>
    <button
      type="button"
      class="recipe-favorite"
      :aria-label="recipe.isFavorite ? '已加入最愛' : '加入最愛'"
      :disabled="toggling"
      @click.stop="emit('toggle-favorite', recipe.id)"
    >
      {{ recipe.isFavorite ? '❤️' : '♡' }}
    </button>
  </article>
</template>

<style scoped>
.recipe-card {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 4px;
}

.recipe-main {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 44px;
  padding: 8px 12px;
  background: none;
  border: none;
  text-align: left;
  color: inherit;
  font: inherit;
  overflow: hidden;
}

.recipe-thumb {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--border);
}

.recipe-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.recipe-thumb-fallback {
  font-size: 22px;
}

.recipe-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.recipe-info h3 {
  margin: 0;
  font-size: 16px;
  color: var(--text-h);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recipe-meta {
  font-size: 12px;
  color: var(--text);
}

.recipe-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.tag {
  font-size: 12px;
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 1px 8px;
}

.recipe-favorite {
  flex-shrink: 0;
  min-width: 44px;
  min-height: 44px;
  border: none;
  background: none;
  font-size: 22px;
  color: var(--accent);
}

.recipe-favorite:disabled {
  opacity: 0.5;
}
</style>
