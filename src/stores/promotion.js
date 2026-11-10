import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  fetchLastSyncedAt,
  fetchPromotions,
  PROMOTION_PAGE_SIZE,
} from '../services/promotionService'

export const usePromotionStore = defineStore('promotion', () => {
  const promotions = ref([])
  const hasMore = ref(false)
  const lastSyncedAt = ref(null)

  const DEFAULT_FILTERS = { category: '', storeSource: '', query: '', sort: 'recommended' }

  let filters = { ...DEFAULT_FILTERS }
  let nextPage = 0
  // Switching filters while a page is still loading must not let the older, slower response
  // overwrite the newer one - every load checks it's still the latest before touching state.
  let latestRequest = 0

  async function loadPromotions(newFilters = {}) {
    filters = { ...DEFAULT_FILTERS, ...newFilters }
    const request = ++latestRequest
    const items = await fetchPromotions({ ...filters, page: 0 })
    if (request !== latestRequest) return

    promotions.value = items
    nextPage = 1
    hasMore.value = items.length === PROMOTION_PAGE_SIZE
  }

  async function loadMore() {
    const request = latestRequest
    const items = await fetchPromotions({ ...filters, page: nextPage })
    if (request !== latestRequest) return

    promotions.value.push(...items)
    nextPage++
    hasMore.value = items.length === PROMOTION_PAGE_SIZE
  }

  async function loadLastSyncedAt() {
    lastSyncedAt.value = await fetchLastSyncedAt()
  }

  return { promotions, hasMore, lastSyncedAt, loadPromotions, loadMore, loadLastSyncedAt }
})
