<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFoodStore } from '../stores/food'
import { CATEGORIES } from '../utils/constants'

const route = useRoute()
const router = useRouter()
const foodStore = useFoodStore()

const editingId = computed(() => route.params.id || null)
const isLoading = ref(!!editingId.value)
const isSubmitting = ref(false)
const errorMessage = ref('')

const form = reactive({
  name: '',
  category: CATEGORIES[0],
  quantity: 1,
  expiryDate: '',
})

onMounted(async () => {
  if (!editingId.value) return

  try {
    const existing = await foodStore.fetchFood(editingId.value)
    form.name = existing.name
    form.category = existing.category
    form.quantity = existing.quantity
    form.expiryDate = existing.expiryDate || ''
  } catch {
    errorMessage.value = '載入物品資料失敗，請稍後再試。'
  } finally {
    isLoading.value = false
  }
})

async function handleSubmit() {
  if (!form.name.trim()) return

  const payload = {
    name: form.name.trim(),
    category: form.category,
    quantity: Number(form.quantity) || 1,
    expiryDate: form.expiryDate || null,
  }

  errorMessage.value = ''
  isSubmitting.value = true
  try {
    if (editingId.value) {
      await foodStore.updateFood(editingId.value, payload)
    } else {
      await foodStore.addFood(payload)
    }
    router.push({ name: 'refrigerator' })
  } catch {
    errorMessage.value = '儲存失敗，請稍後再試。'
  } finally {
    isSubmitting.value = false
  }
}

async function handleDelete() {
  if (!editingId.value) return
  if (!confirm('確定要刪除這項食材嗎？')) return

  errorMessage.value = ''
  isSubmitting.value = true
  try {
    await foodStore.deleteFood(editingId.value)
    router.push({ name: 'refrigerator' })
  } catch {
    errorMessage.value = '刪除失敗，請稍後再試。'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="food-form-page">
    <h1>{{ editingId ? '編輯物品' : '新增物品' }}</h1>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    <p v-if="isLoading" class="loading">載入中…</p>
    <form v-else class="food-form" @submit.prevent="handleSubmit">
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
        <button type="submit" class="submit" :disabled="isSubmitting">
          {{ isSubmitting ? '儲存中…' : editingId ? '儲存' : '新增' }}
        </button>
        <button
          v-if="editingId"
          type="button"
          class="delete"
          :disabled="isSubmitting"
          @click="handleDelete"
        >
          刪除
        </button>
        <RouterLink :to="{ name: 'refrigerator' }" class="cancel">取消</RouterLink>
      </div>
    </form>
  </main>
</template>

<style scoped>
.food-form-page {
  padding: 16px;
}

.loading {
  color: var(--text);
}

.error {
  color: #c53232;
}

.food-form {
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

.submit:disabled,
.delete:disabled {
  opacity: 0.6;
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
  .food-form-page {
    padding: 32px;
  }
}
</style>
