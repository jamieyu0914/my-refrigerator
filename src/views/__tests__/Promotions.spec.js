import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, shallowMount } from '@vue/test-utils'
import Promotions from '../Promotions.vue'
import CategoryFilter from '../../components/CategoryFilter.vue'
import PromotionCard from '../../components/PromotionCard.vue'
import PromotionSearchBar from '../../components/PromotionSearchBar.vue'
import { usePromotionStore } from '../../stores/promotion'
import { useShoppingListStore } from '../../stores/shoppingList'
import { CATEGORIES, STORE_SOURCES } from '../../utils/constants'

vi.mock('../../stores/promotion', () => ({
  usePromotionStore: vi.fn(),
}))

vi.mock('../../stores/shoppingList', () => ({
  useShoppingListStore: vi.fn(),
}))

const PROMOTION = {
  id: 1,
  name: '鮮乳',
  category: '乳製品',
  storeSource: '大全聯',
  salePrice: 70,
  marketPrice: 100,
  discountRate: 0.3,
  referencePrice: null,
  badges: ['deep_discount'],
  imageUrl: null,
  productUrl: 'https://pxbox.es.pxmart.com.tw/product/1',
  lastSeenAt: '2026-10-01T22:00:00+00:00',
}

function mountWithStores({ promotion = {}, shoppingList = {} } = {}) {
  const promotionStore = {
    promotions: [],
    hasMore: false,
    lastSyncedAt: null,
    loadPromotions: vi.fn().mockResolvedValue(undefined),
    loadMore: vi.fn().mockResolvedValue(undefined),
    loadLastSyncedAt: vi.fn().mockResolvedValue(undefined),
    ...promotion,
  }
  const shoppingListStore = {
    addItem: vi.fn().mockResolvedValue(undefined),
    ...shoppingList,
  }
  usePromotionStore.mockReturnValue(promotionStore)
  useShoppingListStore.mockReturnValue(shoppingListStore)

  return { wrapper: shallowMount(Promotions), promotionStore, shoppingListStore }
}

describe('Promotions.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows a loading message while promotions are being fetched', () => {
    const { wrapper } = mountWithStores({
      promotion: { loadPromotions: vi.fn(() => new Promise(() => {})) },
    })

    expect(wrapper.text()).toContain('載入中')
  })

  it('loads promotions with no filters and the last sync time on mount', async () => {
    const { promotionStore } = mountWithStores()
    await flushPromises()

    expect(promotionStore.loadPromotions).toHaveBeenCalledWith({
      category: '',
      storeSource: '',
      query: '',
      sort: 'recommended',
    })
    expect(promotionStore.loadLastSyncedAt).toHaveBeenCalled()
  })

  it('shows an error message when loading fails, and stops loading', async () => {
    const { wrapper } = mountWithStores({
      promotion: { loadPromotions: vi.fn().mockRejectedValue(new Error('fail')) },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('載入特價食材失敗')
    expect(wrapper.text()).not.toContain('載入中')
  })

  it('still shows the list when only the last-sync lookup fails', async () => {
    const { wrapper } = mountWithStores({
      promotion: {
        promotions: [PROMOTION],
        loadLastSyncedAt: vi.fn().mockRejectedValue(new Error('fail')),
      },
    })
    await flushPromises()

    expect(wrapper.findAllComponents(PromotionCard)).toHaveLength(1)
    expect(wrapper.find('.error').exists()).toBe(false)
  })

  it('shows an empty message when there are no promotions', async () => {
    const { wrapper } = mountWithStores()
    await flushPromises()

    expect(wrapper.text()).toContain('目前沒有符合條件的特價食材')
  })

  it('renders a card per promotion and the source disclaimer with the sync time', async () => {
    const { wrapper } = mountWithStores({
      promotion: { promotions: [PROMOTION], lastSyncedAt: '2026-10-01T22:00:00+00:00' },
    })
    await flushPromises()

    expect(wrapper.findComponent(PromotionCard).props('promotion')).toEqual(PROMOTION)
    expect(wrapper.text()).toContain('以官網為準')
    expect(wrapper.text()).toContain('資料更新於')
  })

  it('offers store source and category filters', () => {
    const { wrapper } = mountWithStores()
    const filters = wrapper.findAllComponents(CategoryFilter)

    expect(filters[0].props('categories')).toEqual(STORE_SOURCES)
    expect(filters[1].props('categories')).toEqual(CATEGORIES)
  })

  it('reloads with the selected filters when they change', async () => {
    const { wrapper, promotionStore } = mountWithStores()
    await flushPromises()
    const [storeFilter, categoryFilter] = wrapper.findAllComponents(CategoryFilter)

    await storeFilter.vm.$emit('update:modelValue', '大全聯')
    await flushPromises()
    await categoryFilter.vm.$emit('update:modelValue', '海鮮')
    await flushPromises()

    expect(promotionStore.loadPromotions).toHaveBeenLastCalledWith({
      category: '海鮮',
      storeSource: '大全聯',
      query: '',
      sort: 'recommended',
    })
  })

  describe('search and sort', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('reloads immediately with the selected sort', async () => {
      const { wrapper, promotionStore } = mountWithStores()
      await flushPromises()

      await wrapper.findComponent(PromotionSearchBar).vm.$emit('update:sort', 'price_asc')
      await flushPromises()

      expect(promotionStore.loadPromotions).toHaveBeenLastCalledWith(
        expect.objectContaining({ sort: 'price_asc' }),
      )
    })

    it('waits for the user to stop typing, then searches once with the trimmed query', async () => {
      const { wrapper, promotionStore } = mountWithStores()
      await flushPromises()
      promotionStore.loadPromotions.mockClear()
      const searchBar = wrapper.findComponent(PromotionSearchBar)

      await searchBar.vm.$emit('update:query', '鮭')
      vi.advanceTimersByTime(200)
      await searchBar.vm.$emit('update:query', ' 鮭魚 ')
      vi.advanceTimersByTime(299)
      expect(promotionStore.loadPromotions).not.toHaveBeenCalled()

      vi.advanceTimersByTime(1)
      await flushPromises()

      expect(promotionStore.loadPromotions).toHaveBeenCalledTimes(1)
      expect(promotionStore.loadPromotions).toHaveBeenCalledWith(
        expect.objectContaining({ query: '鮭魚' }),
      )
    })

    it('a filter change runs the pending search right away instead of twice', async () => {
      const { wrapper, promotionStore } = mountWithStores()
      await flushPromises()
      promotionStore.loadPromotions.mockClear()

      await wrapper.findComponent(PromotionSearchBar).vm.$emit('update:query', '鮭魚')
      await wrapper.findAllComponents(CategoryFilter)[1].vm.$emit('update:modelValue', '海鮮')
      vi.advanceTimersByTime(1000)
      await flushPromises()

      expect(promotionStore.loadPromotions).toHaveBeenCalledTimes(1)
      expect(promotionStore.loadPromotions).toHaveBeenCalledWith(
        expect.objectContaining({ query: '鮭魚', category: '海鮮' }),
      )
    })

    it('cancels a pending search when the page is left', async () => {
      const { wrapper, promotionStore } = mountWithStores()
      await flushPromises()
      promotionStore.loadPromotions.mockClear()

      await wrapper.findComponent(PromotionSearchBar).vm.$emit('update:query', '鮭魚')
      wrapper.unmount()
      vi.advanceTimersByTime(1000)

      expect(promotionStore.loadPromotions).not.toHaveBeenCalled()
    })

    it('shows a search-specific empty message', async () => {
      const { wrapper } = mountWithStores()
      await flushPromises()

      await wrapper.findComponent(PromotionSearchBar).vm.$emit('update:query', '不存在')
      vi.advanceTimersByTime(300)
      await flushPromises()

      expect(wrapper.text()).toContain('找不到符合「不存在」的特價食材')
    })
  })

  it('loads the next page from the load-more button only when there is more', async () => {
    const { wrapper, promotionStore } = mountWithStores({
      promotion: { promotions: [PROMOTION], hasMore: true },
    })
    await flushPromises()

    await wrapper.find('.load-more').trigger('click')
    await flushPromises()

    expect(promotionStore.loadMore).toHaveBeenCalledTimes(1)
  })

  it('hides the load-more button when there are no more pages', async () => {
    const { wrapper } = mountWithStores({ promotion: { promotions: [PROMOTION] } })
    await flushPromises()

    expect(wrapper.find('.load-more').exists()).toBe(false)
  })

  it('shows an error when loading more fails', async () => {
    const { wrapper } = mountWithStores({
      promotion: {
        promotions: [PROMOTION],
        hasMore: true,
        loadMore: vi.fn().mockRejectedValue(new Error('fail')),
      },
    })
    await flushPromises()

    await wrapper.find('.load-more').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('載入更多失敗')
  })

  it('adds a promotion to the shopping list with its category, and marks it added', async () => {
    const { wrapper, shoppingListStore } = mountWithStores({ promotion: { promotions: [PROMOTION] } })
    await flushPromises()

    await wrapper.findComponent(PromotionCard).vm.$emit('add-to-shopping-list', PROMOTION)
    await flushPromises()

    expect(shoppingListStore.addItem).toHaveBeenCalledWith({
      name: '鮮乳',
      quantity: 1,
      unit: '',
      category: '乳製品',
    })
    expect(wrapper.findComponent(PromotionCard).props('added')).toBe(true)
  })

  it('does not add the same promotion twice', async () => {
    const { wrapper, shoppingListStore } = mountWithStores({ promotion: { promotions: [PROMOTION] } })
    await flushPromises()

    await wrapper.findComponent(PromotionCard).vm.$emit('add-to-shopping-list', PROMOTION)
    await flushPromises()
    await wrapper.findComponent(PromotionCard).vm.$emit('add-to-shopping-list', PROMOTION)
    await flushPromises()

    expect(shoppingListStore.addItem).toHaveBeenCalledTimes(1)
  })

  it('shows an error and leaves the item addable when adding fails', async () => {
    const { wrapper } = mountWithStores({
      promotion: { promotions: [PROMOTION] },
      shoppingList: { addItem: vi.fn().mockRejectedValue(new Error('fail')) },
    })
    await flushPromises()

    await wrapper.findComponent(PromotionCard).vm.$emit('add-to-shopping-list', PROMOTION)
    await flushPromises()

    expect(wrapper.text()).toContain('加入採買清單失敗')
    expect(wrapper.findComponent(PromotionCard).props('added')).toBe(false)
    expect(wrapper.findComponent(PromotionCard).props('adding')).toBe(false)
  })
})
