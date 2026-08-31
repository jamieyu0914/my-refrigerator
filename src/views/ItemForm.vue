<script setup>
import { computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CATEGORIES, useItems } from '../composables/useItems'

const route = useRoute()
const router = useRouter()
const { getItem, addItem, updateItem, deleteItem } = useItems()

const editingId = computed(() => route.params.id || null)
const existing = editingId.value ? getItem(editingId.value) : null

const form = reactive({
  name: existing?.name || '',
  category: existing?.category || CATEGORIES[0],
  quantity: existing?.quantity ?? 1,
  expiryDate: existing?.expiryDate || '',
})

function handleSubmit() {
  if (!form.name.trim()) return

  const payload = {
    name: form.name.trim(),
    category: form.category,
    quantity: Number(form.quantity) || 1,
    expiryDate: form.expiryDate || null,
  }

  if (editingId.value) {
    updateItem(editingId.value, payload)
  } else {
    addItem(payload)
  }

  router.push({ name: 'home' })
}

function handleDelete() {
  if (!editingId.value) return
  deleteItem(editingId.value)
  router.push({ name: 'home' })
}
</script>

<template>
  <main class="item-form-page">
    <h1>{{ editingId ? '編輯物品' : '新增物品' }}</h1>
    <form class="item-form" @submit.prevent="handleSubmit">
      <label class="field">
        <span>名稱</span>
        <input v-model="form.name" type="text" placeholder="例如：牛奶" required />
      </label>

      <label class="field">
        <span>分類</span>
        <select v-model="form.category">
          <option v-for="category in CATEGORIES" :key="category" :value="category">
            {{ category }}
          </option>
        </select>
      </label>

      <label class="field">
        <span>數量</span>
        <input v-model.number="form.quantity" type="number" min="1" />
      </label>

      <label class="field">
        <span>到期日</span>
        <input v-model="form.expiryDate" type="date" />
      </label>

      <div class="actions">
        <button type="submit" class="submit">{{ editingId ? '儲存' : '新增' }}</button>
        <button v-if="editingId" type="button" class="delete" @click="handleDelete">刪除</button>
        <RouterLink :to="{ name: 'home' }" class="cancel">取消</RouterLink>
      </div>
    </form>
  </main>
</template>

<style scoped>
.item-form-page {
  padding: 16px;
}

.item-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 420px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
}

.field input,
.field select {
  min-height: 44px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 16px;
  background: var(--bg);
  color: var(--text-h);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.submit {
  min-height: 44px;
  padding: 0 20px;
  border: none;
  border-radius: 8px;
  background: var(--accent);
  color: #fff;
  font-size: 16px;
}

.delete {
  min-height: 44px;
  padding: 0 20px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: none;
  color: #c53232;
  font-size: 16px;
}

.cancel {
  min-height: 44px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  color: var(--text);
  text-decoration: none;
}

@media (min-width: 768px) {
  .item-form-page {
    padding: 32px;
  }
}
</style>
