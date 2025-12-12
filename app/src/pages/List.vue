<template>
  <div class="container">
    <h1>Local List App</h1>

    <div class="input-group">
      <input v-model="newItem" placeholder="Enter item..." />
      <button @click="addItem">Add</button>
    </div>

    <ul>
      <li v-for="(item, index) in list" :key="index">
        {{ item }}
        <button class="delete" @click="removeItem(index)">X</button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useStorage } from '../composables/useStorage'

const newItem = ref('')
const list = ref([])

const { load, save } = useStorage('my-list')

// 載入資料
onMounted(async () => {
  list.value = await load()
})

const addItem = async () => {
  if (!newItem.value.trim()) return
  list.value.push(newItem.value.trim())
  newItem.value = ''
  await save(list.value)
}

const removeItem = async (index) => {
  list.value.splice(index, 1)
  await save(list.value)
}
</script>

<style>
.container {
  max-width: 400px;
  margin: auto;
  padding: 20px;
  font-family: Arial;
}

.input-group {
  display: flex;
  gap: 10px;
}

input {
  flex: 1;
  padding: 10px;
  font-size: 1rem;
}

button {
  padding: 10px 15px;
  font-size: 1rem;
  cursor: pointer;
}

ul {
  padding: 0;
}

li {
  list-style: none;
  padding: 10px;
  background: #f2f2f2;
  margin-top: 8px;
  display: flex;
  justify-content: space-between;
}

.delete {
  background: red;
  color: white;
}
</style>
