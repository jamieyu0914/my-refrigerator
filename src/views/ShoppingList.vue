<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useShoppingListStore } from '../stores/shoppingList'
import { useFoodStore } from '../stores/food'
import { CATEGORIES } from '../utils/constants'
import ShoppingItemRow from '../components/ShoppingItemRow.vue'

const shoppingListStore = useShoppingListStore()
const foodStore = useFoodStore()

const isLoading = ref(true)
const isAdding = ref(false)
const errorMessage = ref('')

const editingId = ref(null)
const isSavingEdit = ref(false)
const togglingIds = ref([])
const deletingIds = ref([])

const form = reactive({
  name: '',
  quantity: 1,
  unit: '',
  category: CATEGORIES[0],
})

onMounted(async () => {
  try {
    await shoppingListStore.loadItems()
  } catch {
    errorMessage.value = '載入採買清單失敗，請稍後再試。'
  } finally {
    isLoading.value = false
  }
})

async function handleAdd() {
  if (!form.name.trim()) return

  errorMessage.value = ''
  isAdding.value = true
  try {
    await shoppingListStore.addItem({
      name: form.name.trim(),
      quantity: Number(form.quantity) || 1,
      unit: form.unit.trim(),
      category: form.category,
    })
    form.name = ''
    form.quantity = 1
    form.unit = ''
    form.category = CATEGORIES[0]
  } catch {
    errorMessage.value = '新增失敗，請稍後再試。'
  } finally {
    isAdding.value = false
  }
}

async function handleToggle(id) {
  if (togglingIds.value.includes(id)) return

  const item = shoppingListStore.items.find((i) => i.id === id)
  if (!item) return

  errorMessage.value = ''
  togglingIds.value.push(id)
  const wasPurchased = item.purchased
  try {
    await shoppingListStore.togglePurchased(id)
    if (!wasPurchased) {
      await foodStore.addFood({
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        expiryDate: null,
      })
    }
  } catch {
    errorMessage.value = '更新狀態失敗，請稍後再試。'
  } finally {
    togglingIds.value = togglingIds.value.filter((togglingId) => togglingId !== id)
  }
}

function handleEditStart(id) {
  errorMessage.value = ''
  editingId.value = id
}

function handleEditCancel() {
  editingId.value = null
}

async function handleEditSave({ id, updates }) {
  if (isSavingEdit.value) return

  errorMessage.value = ''
  isSavingEdit.value = true
  try {
    await shoppingListStore.updateItem(id, updates)
    editingId.value = null
  } catch {
    errorMessage.value = '修改失敗，請稍後再試。'
  } finally {
    isSavingEdit.value = false
  }
}

async function handleDelete(id) {
  if (deletingIds.value.includes(id)) return
  if (!confirm('確定要刪除這個項目嗎？')) return

  errorMessage.value = ''
  deletingIds.value.push(id)
  try {
    await shoppingListStore.deleteItem(id)
  } catch {
    errorMessage.value = '刪除失敗，請稍後再試。'
  } finally {
    deletingIds.value = deletingIds.value.filter((deletingId) => deletingId !== id)
  }
}
</script>

<template>
  <main class="shopping-list">
    <h1>採買清單</h1>

    <form class="add-form" @submit.prevent="handleAdd">
      <input
        v-model="form.name"
        type="text"
        placeholder="要買什麼？"
        required
        :disabled="isAdding"
      />
      <input v-model.number="form.quantity" type="number" min="1" :disabled="isAdding" />
      <input
        v-model="form.unit"
        type="text"
        placeholder="單位"
        class="unit-input"
        :disabled="isAdding"
      />
      <select v-model="form.category" class="category-select" :disabled="isAdding">
        <option v-for="category in CATEGORIES" :key="category" :value="category">
          {{ category }}
        </option>
      </select>
      <button type="submit" :disabled="isAdding">{{ isAdding ? '新增中…' : '新增' }}</button>
    </form>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    <p v-if="isLoading" class="empty">載入中…</p>
    <p v-else-if="shoppingListStore.items.length === 0" class="empty">
      採買清單是空的，新增第一項吧！
    </p>
    <ul v-else class="list">
      <ShoppingItemRow
        v-for="item in shoppingListStore.items"
        :key="item.id"
        :item="item"
        :editing="editingId === item.id"
        :saving="isSavingEdit && editingId === item.id"
        :toggling="togglingIds.includes(item.id)"
        :deleting="deletingIds.includes(item.id)"
        @toggle="handleToggle"
        @edit-start="handleEditStart"
        @edit-cancel="handleEditCancel"
        @edit-save="handleEditSave"
        @delete="handleDelete"
      />
    </ul>
  </main>
</template>

<style scoped>
.shopping-list {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.add-form {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.add-form input[type='text'] {
  flex: 1;
  min-width: 140px;
}

.add-form input[type='number'] {
  width: 64px;
}

.add-form .unit-input {
  width: 72px;
}

.add-form .category-select {
  width: 96px;
}

.add-form input,
.add-form select {
  min-height: 44px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 16px;
  background: var(--bg);
  color: var(--text-h);
}

.add-form input:disabled,
.add-form select:disabled {
  opacity: 0.6;
}

.add-form button {
  min-height: 44px;
  padding: 0 16px;
  border: none;
  border-radius: 8px;
  background: var(--accent);
  color: #fff;
  font-size: 15px;
}

.add-form button:disabled {
  opacity: 0.6;
}

.empty {
  color: var(--text);
}

.error {
  color: #c53232;
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

@media (min-width: 768px) {
  .shopping-list {
    padding: 32px;
  }
}
</style>
