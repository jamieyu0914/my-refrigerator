<script setup>
import { ref, watch } from 'vue'
import { CATEGORIES } from '../utils/constants'

const props = defineProps({
  item: { type: Object, required: true },
  editing: { type: Boolean, default: false },
  saving: { type: Boolean, default: false },
  toggling: { type: Boolean, default: false },
  deleting: { type: Boolean, default: false },
})

const emit = defineEmits(['toggle', 'edit-start', 'edit-cancel', 'edit-save', 'delete'])

const draftName = ref(props.item.name)
const draftQuantity = ref(props.item.quantity)
const draftUnit = ref(props.item.unit || '')
const draftCategory = ref(props.item.category)

watch(
  () => props.editing,
  (editing) => {
    if (!editing) return
    draftName.value = props.item.name
    draftQuantity.value = props.item.quantity
    draftUnit.value = props.item.unit || ''
    draftCategory.value = props.item.category
  },
)

function handleSave() {
  if (!draftName.value.trim()) return

  emit('edit-save', {
    id: props.item.id,
    updates: {
      name: draftName.value.trim(),
      quantity: Number(draftQuantity.value) || 1,
      unit: draftUnit.value.trim(),
      category: draftCategory.value,
    },
  })
}
</script>

<template>
  <li class="item-row">
    <template v-if="!editing">
      <label class="check">
        <input
          type="checkbox"
          :checked="item.purchased"
          :disabled="toggling"
          @change="emit('toggle', item.id)"
        />
        <span class="item-text" :class="{ purchased: item.purchased }">
          <span class="item-name">{{ item.name }}</span>
          <span class="item-qty">{{ item.quantity }}{{ item.unit }}</span>
        </span>
      </label>
      <div class="row-actions">
        <button
          type="button"
          class="icon-btn"
          aria-label="編輯"
          @click="emit('edit-start', item.id)"
        >
          ✎
        </button>
        <button
          type="button"
          class="icon-btn"
          aria-label="刪除"
          :disabled="deleting"
          @click="emit('delete', item.id)"
        >
          🗑
        </button>
      </div>
    </template>

    <form v-else class="edit-form" @submit.prevent="handleSave">
      <input v-model="draftName" type="text" class="edit-name" required />
      <input v-model.number="draftQuantity" type="number" min="1" class="edit-quantity" />
      <input v-model="draftUnit" type="text" placeholder="單位" class="edit-unit" />
      <select v-model="draftCategory" class="edit-category">
        <option v-for="category in CATEGORIES" :key="category" :value="category">
          {{ category }}
        </option>
      </select>
      <div class="row-actions">
        <button type="submit" class="save" :disabled="saving">
          {{ saving ? '儲存中…' : '儲存' }}
        </button>
        <button type="button" class="cancel" :disabled="saving" @click="emit('edit-cancel')">
          取消
        </button>
      </div>
    </form>
  </li>
</template>

<style scoped>
.item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 8px 12px;
}

.check {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  flex: 1;
}

.check input[type='checkbox'] {
  width: 20px;
  height: 20px;
}

.item-text {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.item-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-qty {
  flex-shrink: 0;
  color: var(--text);
}

.purchased .item-name,
.purchased .item-qty {
  text-decoration: line-through;
  color: var(--text);
}

.row-actions {
  display: flex;
  gap: 4px;
}

.icon-btn {
  min-width: 44px;
  min-height: 44px;
  border: none;
  background: none;
  font-size: 18px;
  color: var(--text);
}

.icon-btn:disabled {
  opacity: 0.5;
}

.edit-form {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1;
}

.edit-name {
  flex: 1;
  min-width: 120px;
}

.edit-quantity {
  width: 64px;
}

.edit-unit {
  width: 72px;
}

.edit-category {
  width: 96px;
}

.edit-name,
.edit-quantity,
.edit-unit,
.edit-category {
  min-height: 44px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 16px;
  background: var(--bg);
  color: var(--text-h);
}

.save,
.cancel {
  min-height: 44px;
  padding: 0 16px;
  border-radius: 8px;
  font-size: 15px;
}

.save {
  border: none;
  background: var(--accent);
  color: #fff;
}

.save:disabled,
.cancel:disabled {
  opacity: 0.6;
}

.cancel {
  border: 1px solid var(--border);
  background: none;
  color: var(--text);
}
</style>
