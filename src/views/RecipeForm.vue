<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRecipeStore } from '../stores/recipe'

const DIFFICULTIES = ['簡單', '普通', '困難']

const route = useRoute()
const router = useRouter()
const recipeStore = useRecipeStore()

const editingId = computed(() => route.params.id || null)
const isLoading = ref(!!editingId.value)
const isSubmitting = ref(false)
const errorMessage = ref('')

const form = reactive({
  title: '',
  imageUrl: '',
  cookTimeMinutes: '',
  difficulty: DIFFICULTIES[0],
  description: '',
  tagsText: '',
  ingredients: [{ name: '', amount: '' }],
  steps: [{ description: '' }],
})

onMounted(async () => {
  if (!editingId.value) return

  try {
    const existing = await recipeStore.fetchRecipe(editingId.value)
    form.title = existing.title
    form.imageUrl = existing.imageUrl || ''
    form.cookTimeMinutes = existing.cookTimeMinutes ?? ''
    form.difficulty = existing.difficulty || DIFFICULTIES[0]
    form.description = existing.description || ''
    form.tagsText = existing.tags.join(', ')
    form.ingredients = existing.ingredients.length
      ? existing.ingredients.map((ingredient) => ({
          name: ingredient.name,
          amount: ingredient.amount || '',
        }))
      : [{ name: '', amount: '' }]
    form.steps = existing.steps.length
      ? existing.steps.map((step) => ({ description: step.description }))
      : [{ description: '' }]
  } catch {
    errorMessage.value = '載入食譜資料失敗，請稍後再試。'
  } finally {
    isLoading.value = false
  }
})

function addIngredient() {
  form.ingredients.push({ name: '', amount: '' })
}

function removeIngredient(index) {
  form.ingredients.splice(index, 1)
}

function addStep() {
  form.steps.push({ description: '' })
}

function removeStep(index) {
  form.steps.splice(index, 1)
}

async function handleSubmit() {
  const ingredients = form.ingredients
    .map((ingredient) => ({ name: ingredient.name.trim(), amount: ingredient.amount.trim() }))
    .filter((ingredient) => ingredient.name)

  const steps = form.steps
    .map((step) => ({ description: step.description.trim() }))
    .filter((step) => step.description)

  if (!form.title.trim() || ingredients.length === 0 || steps.length === 0) return

  const payload = {
    title: form.title.trim(),
    imageUrl: form.imageUrl.trim() || null,
    cookTimeMinutes: Number(form.cookTimeMinutes) || null,
    difficulty: form.difficulty,
    description: form.description.trim() || null,
    tags: form.tagsText
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
    ingredients,
    steps,
  }

  errorMessage.value = ''
  isSubmitting.value = true
  try {
    if (editingId.value) {
      await recipeStore.updateRecipe(editingId.value, payload)
      router.push({ name: 'recipe-detail', params: { id: editingId.value } })
    } else {
      await recipeStore.addRecipe(payload)
      router.push({ name: 'recipes' })
    }
  } catch {
    errorMessage.value = '儲存失敗，請稍後再試。'
  } finally {
    isSubmitting.value = false
  }
}

async function handleDelete() {
  if (!editingId.value) return
  if (!confirm('確定要刪除這份食譜嗎？')) return

  errorMessage.value = ''
  isSubmitting.value = true
  try {
    await recipeStore.deleteRecipe(editingId.value)
    router.push({ name: 'recipes' })
  } catch {
    errorMessage.value = '刪除失敗，請稍後再試。'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="recipe-form-page">
    <h1>{{ editingId ? '編輯食譜' : '新增食譜' }}</h1>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    <p v-if="isLoading" class="loading">載入中…</p>
    <form v-else class="recipe-form" @submit.prevent="handleSubmit">
      <label class="field">
        <span>標題</span>
        <input v-model="form.title" type="text" placeholder="例如：番茄炒蛋" required />
      </label>

      <label class="field">
        <span>封面圖片網址（選填）</span>
        <input v-model="form.imageUrl" type="url" placeholder="https://..." />
      </label>

      <div class="row">
        <label class="field">
          <span>料理時間（分鐘）</span>
          <input v-model.number="form.cookTimeMinutes" type="number" min="0" placeholder="15" />
        </label>

        <label class="field">
          <span>難度</span>
          <select v-model="form.difficulty">
            <option v-for="level in DIFFICULTIES" :key="level" :value="level">{{ level }}</option>
          </select>
        </label>
      </div>

      <label class="field">
        <span>介紹（選填）</span>
        <textarea v-model="form.description" rows="3" placeholder="這道料理的簡單介紹"></textarea>
      </label>

      <fieldset class="field">
        <legend>食材</legend>
        <div v-for="(ingredient, index) in form.ingredients" :key="index" class="repeat-row">
          <input v-model="ingredient.name" type="text" placeholder="名稱，例如：雞蛋" />
          <input v-model="ingredient.amount" type="text" placeholder="份量，例如：3 顆" class="amount-input" />
          <button
            type="button"
            class="remove"
            aria-label="移除這項食材"
            :disabled="form.ingredients.length === 1"
            @click="removeIngredient(index)"
          >
            ✕
          </button>
        </div>
        <button type="button" class="add-row" @click="addIngredient">+ 新增食材</button>
      </fieldset>

      <fieldset class="field">
        <legend>料理步驟</legend>
        <div v-for="(step, index) in form.steps" :key="index" class="repeat-row">
          <span class="step-number">{{ index + 1 }}.</span>
          <input v-model="step.description" type="text" placeholder="描述這個步驟" />
          <button
            type="button"
            class="remove"
            aria-label="移除這個步驟"
            :disabled="form.steps.length === 1"
            @click="removeStep(index)"
          >
            ✕
          </button>
        </div>
        <button type="button" class="add-row" @click="addStep">+ 新增步驟</button>
      </fieldset>

      <label class="field">
        <span>標籤（用逗號分隔，選填）</span>
        <input v-model="form.tagsText" type="text" placeholder="例如：快速, 家常菜" />
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
        <RouterLink :to="{ name: 'recipes' }" class="cancel">取消</RouterLink>
      </div>
    </form>
  </main>
</template>

<style scoped>
.recipe-form-page {
  padding: 16px;
}

.loading {
  color: var(--text);
}

.error {
  color: #c53232;
}

.recipe-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 480px;
}

.row {
  display: flex;
  gap: 12px;
}

.row .field {
  flex: 1;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
  border: none;
  padding: 0;
  margin: 0;
}

.field legend {
  padding: 0;
  font-size: 14px;
  margin-bottom: 6px;
}

.field input,
.field select,
.field textarea {
  min-height: 44px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 16px;
  font-family: inherit;
  background: var(--bg);
  color: var(--text-h);
  resize: vertical;
}

.field textarea {
  padding: 10px 12px;
}

.repeat-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.repeat-row input {
  flex: 1;
  min-width: 0;
}

.amount-input {
  flex: 0 0 96px;
}

.step-number {
  flex-shrink: 0;
  color: var(--text);
  font-size: 14px;
}

.remove {
  flex-shrink: 0;
  min-width: 44px;
  min-height: 44px;
  border: none;
  background: none;
  color: var(--text);
  font-size: 16px;
}

.remove:disabled {
  opacity: 0.4;
}

.add-row {
  min-height: 44px;
  padding: 0 12px;
  border: 1px dashed var(--border);
  border-radius: 8px;
  background: none;
  color: var(--accent);
  font-size: 14px;
  align-self: flex-start;
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
  .recipe-form-page {
    padding: 32px;
  }
}
</style>
