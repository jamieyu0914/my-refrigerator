<script setup>
import { PROMOTION_SORTS } from '../utils/constants'

defineProps({
  query: { type: String, default: '' },
  sort: { type: String, default: 'recommended' },
})

defineEmits(['update:query', 'update:sort'])
</script>

<template>
  <div class="promotion-search-bar">
    <input
      class="promotion-search"
      type="search"
      :value="query"
      placeholder="搜尋特價食材名稱"
      aria-label="搜尋特價食材"
      @input="$emit('update:query', $event.target.value)"
    />
    <select
      class="promotion-sort"
      :value="sort"
      aria-label="排序方式"
      @change="$emit('update:sort', $event.target.value)"
    >
      <option v-for="option in PROMOTION_SORTS" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
  </div>
</template>

<style scoped>
.promotion-search-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.promotion-search,
.promotion-sort {
  min-height: 44px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 16px;
  background: var(--bg);
  color: var(--text-h);
}

.promotion-search {
  flex: 1 1 200px;
  min-width: 0;
}

.promotion-sort {
  flex: 0 0 auto;
}
</style>
