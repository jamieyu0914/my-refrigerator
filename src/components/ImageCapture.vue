<script setup>
import { ref } from 'vue'

const emit = defineEmits(['select'])

const fileInput = ref(null)
const previewUrl = ref('')

function triggerPick() {
  fileInput.value?.click()
}

function handleChange(event) {
  const file = event.target.files?.[0]
  if (!file) return

  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = URL.createObjectURL(file)
  emit('select', file)
}
</script>

<template>
  <div class="image-capture">
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      capture="environment"
      class="file-input"
      @change="handleChange"
    />
    <button type="button" class="pick-button" @click="triggerPick">
      {{ previewUrl ? '重新選擇照片' : '拍照或選擇照片' }}
    </button>
    <img v-if="previewUrl" :src="previewUrl" alt="預覽圖片" class="preview" />
  </div>
</template>

<style scoped>
.image-capture {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.file-input {
  display: none;
}

.pick-button {
  min-height: 44px;
  padding: 0 20px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--accent);
  color: #fff;
  font-size: 16px;
}

.preview {
  width: 100%;
  max-width: 320px;
  border-radius: 8px;
  border: 1px solid var(--border);
}
</style>
