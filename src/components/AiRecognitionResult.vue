<script setup>
import { CATEGORIES } from '../utils/constants'

const props = defineProps({
  items: { type: Array, required: true },
  isSubmitting: { type: Boolean, default: false },
})

const emit = defineEmits(['toggle', 'update-name', 'update-category', 'remove', 'confirm'])

function isLowConfidence(item) {
  return typeof item.confidence === 'number' && item.confidence < 0.6
}
</script>

<template>
  <div class="ai-recognition-result">
    <h2>AI 辨識結果</h2>
    <p class="disclaimer">辨識結果僅供參考，請確認或修改後再加入冰箱。</p>

    <p v-if="items.length === 0" class="empty">
      沒有辨識到食材，請重新拍攝，或
      <RouterLink :to="{ name: 'food-new' }">手動新增</RouterLink>
    </p>

    <ul v-else class="item-list">
      <li v-for="item in items" :key="item.tempId" class="item-row">
        <label class="item-check">
          <input
            type="checkbox"
            :checked="item.selected"
            @change="emit('toggle', item.tempId)"
          />
          <span class="emoji">{{ item.emoji }}</span>
        </label>

        <input
          class="item-name"
          type="text"
          :value="item.name"
          @change="emit('update-name', item.tempId, $event.target.value)"
        />

        <select
          class="item-category"
          :value="item.category"
          @change="emit('update-category', item.tempId, $event.target.value)"
        >
          <option v-for="category in CATEGORIES" :key="category" :value="category">
            {{ category }}
          </option>
        </select>

        <span v-if="isLowConfidence(item)" class="low-confidence">請確認</span>

        <button
          type="button"
          class="remove"
          aria-label="移除"
          @click="emit('remove', item.tempId)"
        >
          ✕
        </button>
      </li>
    </ul>

    <button
      v-if="items.length > 0"
      type="button"
      class="confirm-button"
      :disabled="isSubmitting || !items.some((item) => item.selected)"
      @click="emit('confirm')"
    >
      {{ isSubmitting ? '加入中…' : '確認加入冰箱' }}
    </button>
  </div>
</template>

<style scoped>
.ai-recognition-result {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.disclaimer {
  font-size: 13px;
  color: var(--text);
}

.empty {
  color: var(--text);
}

.item-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0;
  margin: 0;
}

.item-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border: 1px solid var(--border);
  border-radius: 8px;
  flex-wrap: wrap;
}

.item-check {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
}

.item-check input {
  width: 20px;
  height: 20px;
}

.emoji {
  font-size: 20px;
}

.item-name {
  flex: 1 1 120px;
  min-height: 44px;
  min-width: 0;
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  color: var(--text-h);
  font-size: 15px;
}

.item-category {
  min-height: 44px;
  padding: 0 8px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  color: var(--text-h);
  font-size: 14px;
}

.low-confidence {
  font-size: 12px;
  color: #c53232;
  white-space: nowrap;
}

.remove {
  min-width: 44px;
  min-height: 44px;
  border: none;
  background: none;
  color: var(--text);
  font-size: 16px;
}

.confirm-button {
  min-height: 44px;
  padding: 0 20px;
  border: none;
  border-radius: 8px;
  background: var(--accent);
  color: #fff;
  font-size: 16px;
}

.confirm-button:disabled {
  opacity: 0.6;
}
</style>
