import { ref } from 'vue'
import { defineStore } from 'pinia'
import { recognizeFoods } from '../services/aiVisionService'
import { useFoodStore } from './food'

export const useAiVisionStore = defineStore('aiVision', () => {
  const recognizedItems = ref([])

  async function analyzeImage(imageFile) {
    recognizedItems.value = await recognizeFoods(imageFile)
  }

  function updateItem(tempId, updates) {
    const item = recognizedItems.value.find((i) => i.tempId === tempId)
    if (item) Object.assign(item, updates)
  }

  function removeItem(tempId) {
    recognizedItems.value = recognizedItems.value.filter((i) => i.tempId !== tempId)
  }

  function discard() {
    recognizedItems.value = []
  }

  // Only entry point that writes to Supabase - must be called from an explicit user action.
  async function confirmSelected() {
    const foodStore = useFoodStore()
    const toAdd = recognizedItems.value.filter((item) => item.selected)

    const results = await Promise.allSettled(
      toAdd.map((item) =>
        foodStore.addFood({
          name: item.name,
          category: item.category,
          quantity: 1,
          expiryDate: null,
        }),
      ),
    )

    const failedIds = new Set(
      toAdd.filter((_, index) => results[index].status === 'rejected').map((item) => item.tempId),
    )

    // Keep failed items in the draft so the user can retry instead of losing their confirmation.
    recognizedItems.value = recognizedItems.value.filter((item) => failedIds.has(item.tempId))

    if (failedIds.size > 0) {
      throw new Error(`${failedIds.size} 項加入失敗，請重試`)
    }
  }

  return { recognizedItems, analyzeImage, updateItem, removeItem, discard, confirmSelected }
})
