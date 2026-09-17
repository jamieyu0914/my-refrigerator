<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAiVisionStore } from '../stores/aiVision'
import ImageCapture from '../components/ImageCapture.vue'
import AiRecognitionResult from '../components/AiRecognitionResult.vue'

const router = useRouter()
const aiVisionStore = useAiVisionStore()

const isAnalyzing = ref(false)
const isSubmitting = ref(false)
const hasAnalyzed = ref(false)
const errorMessage = ref('')

async function handleSelect(file) {
  errorMessage.value = ''
  hasAnalyzed.value = false
  aiVisionStore.discard()
  isAnalyzing.value = true
  try {
    await aiVisionStore.analyzeImage(file)
    hasAnalyzed.value = true
  } catch (error) {
    console.error('AI 食材辨識失敗', error)
    errorMessage.value = '辨識失敗，請稍後再試或手動新增。'
  } finally {
    isAnalyzing.value = false
  }
}

function handleToggle(tempId) {
  const item = aiVisionStore.recognizedItems.find((i) => i.tempId === tempId)
  if (item) aiVisionStore.updateItem(tempId, { selected: !item.selected })
}

function handleUpdateName(tempId, name) {
  aiVisionStore.updateItem(tempId, { name })
}

function handleUpdateCategory(tempId, category) {
  aiVisionStore.updateItem(tempId, { category })
}

function handleRemove(tempId) {
  aiVisionStore.removeItem(tempId)
}

async function handleConfirm() {
  errorMessage.value = ''
  isSubmitting.value = true
  try {
    await aiVisionStore.confirmSelected()
    router.push({ name: 'refrigerator' })
  } catch (error) {
    console.error('加入冰箱失敗', error)
    errorMessage.value = '部分項目加入失敗，請重試。'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="scan-food-page">
    <h1>拍照辨識食材</h1>
    <p class="hint">AI 只是協助辨識，實際內容請以自行判斷的結果為準。</p>

    <ImageCapture @select="handleSelect" />

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    <p v-if="isAnalyzing" class="loading">辨識中…</p>

    <AiRecognitionResult
      v-else-if="hasAnalyzed"
      :items="aiVisionStore.recognizedItems"
      :is-submitting="isSubmitting"
      @toggle="handleToggle"
      @update-name="handleUpdateName"
      @update-category="handleUpdateCategory"
      @remove="handleRemove"
      @confirm="handleConfirm"
    />
  </main>
</template>

<style scoped>
.scan-food-page {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hint {
  font-size: 13px;
  color: var(--text);
}

.loading {
  color: var(--text);
}

.error {
  color: #c53232;
}

@media (min-width: 768px) {
  .scan-food-page {
    padding: 32px;
  }
}
</style>
