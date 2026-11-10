<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { usePromotionStore } from '../stores/promotion'
import { useShoppingListStore } from '../stores/shoppingList'
import { CATEGORIES, STORE_SOURCES } from '../utils/constants'
import CategoryFilter from '../components/CategoryFilter.vue'
import PromotionCard from '../components/PromotionCard.vue'
import PromotionSearchBar from '../components/PromotionSearchBar.vue'

const SEARCH_DEBOUNCE_MS = 300

const promotionStore = usePromotionStore()
const shoppingListStore = useShoppingListStore()

const selectedCategory = ref('')
const selectedStoreSource = ref('')
const searchQuery = ref('')
const selectedSort = ref('recommended')
const isLoading = ref(true)
const isLoadingMore = ref(false)
const errorMessage = ref('')
const addingIds = ref([])
const addedIds = ref([])

let latestLoad = 0
let searchTimer = null

async function load() {
  clearTimeout(searchTimer)
  const current = ++latestLoad
  errorMessage.value = ''
  isLoading.value = true
  try {
    await promotionStore.loadPromotions({
      category: selectedCategory.value,
      storeSource: selectedStoreSource.value,
      query: searchQuery.value.trim(),
      sort: selectedSort.value,
    })
  } catch {
    if (current === latestLoad) errorMessage.value = '載入特價食材失敗，請稍後再試。'
  } finally {
    if (current === latestLoad) isLoading.value = false
  }
}

onMounted(async () => {
  // The "updated at" line is nice-to-have - its failure shouldn't hide the list.
  promotionStore.loadLastSyncedAt().catch(() => {})
  await load()
})

watch([selectedCategory, selectedStoreSource, selectedSort], load)

// Typing re-queries the server (the list is paged, so it can't be filtered client-side) -
// wait until the user pauses instead of firing a request per keystroke.
watch(searchQuery, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(load, SEARCH_DEBOUNCE_MS)
})

onBeforeUnmount(() => clearTimeout(searchTimer))

async function handleLoadMore() {
  if (isLoadingMore.value) return
  errorMessage.value = ''
  isLoadingMore.value = true
  try {
    await promotionStore.loadMore()
  } catch {
    errorMessage.value = '載入更多失敗，請稍後再試。'
  } finally {
    isLoadingMore.value = false
  }
}

async function handleAddToShoppingList(promotion) {
  if (addingIds.value.includes(promotion.id) || addedIds.value.includes(promotion.id)) return

  errorMessage.value = ''
  addingIds.value.push(promotion.id)
  try {
    await shoppingListStore.addItem({
      name: promotion.name,
      quantity: 1,
      unit: '',
      category: promotion.category,
    })
    addedIds.value.push(promotion.id)
  } catch {
    errorMessage.value = '加入採買清單失敗，請稍後再試。'
  } finally {
    addingIds.value = addingIds.value.filter((id) => id !== promotion.id)
  }
}

const emptyMessage = computed(() =>
  searchQuery.value.trim()
    ? `找不到符合「${searchQuery.value.trim()}」的特價食材。`
    : '目前沒有符合條件的特價食材。',
)

const lastSyncedText = computed(() => {
  if (!promotionStore.lastSyncedAt) return ''
  return new Date(promotionStore.lastSyncedAt).toLocaleString('zh-TW', {
    timeZone: 'Asia/Taipei',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
})
</script>

<template>
  <main class="page">
    <h1>特價食材</h1>
    <p class="source-note">
      價格來自全聯全電商網路商店，與門市價格可能不同，實際以官網為準。
      <template v-if="lastSyncedText">資料更新於 {{ lastSyncedText }}。</template>
    </p>
    <PromotionSearchBar v-model:query="searchQuery" v-model:sort="selectedSort" />
    <CategoryFilter v-model="selectedStoreSource" :categories="STORE_SOURCES" />
    <CategoryFilter v-model="selectedCategory" :categories="CATEGORIES" />
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    <p v-if="isLoading" class="loading">載入中…</p>
    <template v-else>
      <p v-if="promotionStore.promotions.length === 0" class="empty">{{ emptyMessage }}</p>
      <ul v-else class="promotion-list">
        <li v-for="promotion in promotionStore.promotions" :key="promotion.id">
          <PromotionCard
            :promotion="promotion"
            :adding="addingIds.includes(promotion.id)"
            :added="addedIds.includes(promotion.id)"
            @add-to-shopping-list="handleAddToShoppingList"
          />
        </li>
      </ul>
      <button
        v-if="promotionStore.hasMore"
        type="button"
        class="load-more"
        :disabled="isLoadingMore"
        @click="handleLoadMore"
      >
        {{ isLoadingMore ? '載入中…' : '載入更多' }}
      </button>
    </template>
  </main>
</template>

<style scoped>
.page {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page h1 {
  margin: 0;
}

.source-note {
  margin: 0;
  font-size: 13px;
  color: var(--text);
}

.loading,
.empty {
  color: var(--text);
}

.error {
  color: #c53232;
}

.promotion-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 12px;
}

.load-more {
  min-height: 44px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  color: var(--text-h);
  font-size: 15px;
}

.load-more:disabled {
  opacity: 0.6;
}

@media (min-width: 768px) {
  .page {
    padding: 32px;
  }

  .promotion-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1280px) {
  .promotion-list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
