<script setup>
import FoodCard from './FoodCard.vue'

defineProps({
  foods: { type: Array, required: true },
  deletingIds: { type: Array, default: () => [] },
})

defineEmits(['delete'])
</script>

<template>
  <div class="food-list">
    <p v-if="foods.length === 0" class="empty">冰箱空空的，點右下角「+」新增物品吧！</p>
    <FoodCard
      v-for="food in foods"
      :key="food.id"
      :food="food"
      :deleting="deletingIds.includes(food.id)"
      @delete="$emit('delete', $event)"
    />
  </div>
</template>

<style scoped>
.food-list {
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
