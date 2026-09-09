<script setup>
defineProps({
  categories: { type: Array, required: true },
  modelValue: { type: String, default: '' },
})

defineEmits(['update:modelValue'])
</script>

<template>
  <div class="category-filter" role="tablist">
    <button
      type="button"
      class="chip"
      :class="{ active: modelValue === '' }"
      @click="$emit('update:modelValue', '')"
    >
      全部
    </button>
    <button
      v-for="category in categories"
      :key="category"
      type="button"
      class="chip"
      :class="{ active: modelValue === category }"
      @click="$emit('update:modelValue', category)"
    >
      {{ category }}
    </button>
  </div>
</template>

<style scoped>
.category-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.chip {
  min-height: 44px;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--bg);
  color: var(--text);
  font-size: 14px;
  white-space: nowrap;
}

.chip.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}
</style>
