<script setup>
import FoodCard from './FoodCard.vue'

defineProps({
  foods: { type: Array, required: true },
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
