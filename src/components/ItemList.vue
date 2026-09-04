<script setup>
import ItemCard from './ItemCard.vue'

defineProps({
  items: { type: Array, required: true },
})

defineEmits(['delete'])
</script>

<template>
  <div class="item-list">
    <p v-if="items.length === 0" class="empty">冰箱空空的，點右下角「+」新增物品吧！</p>
    <ItemCard
      v-for="item in items"
      :key="item.id"
      :item="item"
      @delete="$emit('delete', $event)"
    />
  </div>
</template>

<style scoped>
.item-list {
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
