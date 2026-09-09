<script setup>
defineProps({
  modelValue: { type: String, default: '' },
})

defineEmits(['update:modelValue'])
</script>

<template>
  <input
    class="recipe-search"
    type="search"
    :value="modelValue"
    placeholder="搜尋食譜名稱或標籤"
    aria-label="搜尋食譜"
    @input="$emit('update:modelValue', $event.target.value)"
  />
</template>

<style scoped>
.recipe-search {
  min-height: 44px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 16px;
  background: var(--bg);
  color: var(--text-h);
}
</style>
