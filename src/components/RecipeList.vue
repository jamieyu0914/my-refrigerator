<script setup>
import RecipeCard from './RecipeCard.vue'

defineProps({
  recipes: { type: Array, required: true },
  togglingIds: { type: Array, default: () => [] },
  emptyMessage: { type: String, default: '還沒有食譜，點右下角「+」新增一個吧！' },
})

defineEmits(['toggle-favorite'])
</script>

<template>
  <div class="recipe-list">
    <p v-if="recipes.length === 0" class="empty">{{ emptyMessage }}</p>
    <RecipeCard
      v-for="recipe in recipes"
      :key="recipe.id"
      :recipe="recipe"
      :toggling="togglingIds.includes(recipe.id)"
      @toggle-favorite="$emit('toggle-favorite', $event)"
    />
  </div>
</template>

<style scoped>
.recipe-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.empty {
  padding: 32px 16px;
  text-align: center;
  color: var(--text);
}
</style>
