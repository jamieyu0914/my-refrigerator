<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useShoppingListStore } from '../stores/shoppingList'

const shoppingListStore = useShoppingListStore()
const isLoading = ref(true)

const form = reactive({
  name: '',
  quantity: 1,
})

onMounted(async () => {
  await shoppingListStore.loadItems()
  isLoading.value = false
})

async function handleAdd() {
  if (!form.name.trim()) return
  await shoppingListStore.addItem({ name: form.name.trim(), quantity: Number(form.quantity) || 1 })
  form.name = ''
  form.quantity = 1
}
</script>

<template>
  <main class="shopping-list">
    <h1>採買清單</h1>

    <form class="add-form" @submit.prevent="handleAdd">
      <input v-model="form.name" type="text" placeholder="要買什麼？" required />
      <input v-model.number="form.quantity" type="number" min="1" />
      <button type="submit">新增</button>
    </form>

    <p v-if="isLoading" class="empty">載入中…</p>
    <p v-else-if="shoppingListStore.items.length === 0" class="empty">採買清單是空的。</p>
    <ul v-else class="list">
      <li v-for="item in shoppingListStore.items" :key="item.id" class="list-item">
        <label class="check">
          <input
            type="checkbox"
            :checked="item.checked"
            @change="shoppingListStore.toggleChecked(item.id)"
          />
          <span :class="{ checked: item.checked }">{{ item.name }} × {{ item.quantity }}</span>
        </label>
        <button
          type="button"
          class="delete"
          aria-label="刪除"
          @click="shoppingListStore.deleteItem(item.id)"
        >
          🗑
        </button>
      </li>
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
  width: 72px;
}

.add-form input {
  min-height: 44px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 16px;
  background: var(--bg);
  color: var(--text-h);
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

.empty {
  color: var(--text);
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.checked {
  text-decoration: line-through;
  color: var(--text);
}

.delete {
  min-width: 44px;
  min-height: 44px;
  border: none;
  background: none;
  font-size: 18px;
  color: var(--text);
}

@media (min-width: 768px) {
  .shopping-list {
    padding: 32px;
  }
}
</style>
