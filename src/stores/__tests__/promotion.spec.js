import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { usePromotionStore } from '../promotion'
import * as promotionService from '../../services/promotionService'

vi.mock('../../services/promotionService', () => ({
  PROMOTION_PAGE_SIZE: 2,
  fetchPromotions: vi.fn(),
  fetchLastSyncedAt: vi.fn(),
}))

function deferred() {
  let resolve
  const promise = new Promise((r) => {
    resolve = r
  })
  return { promise, resolve }
}

describe('promotion store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('loadPromotions fetches page 0 with the given filters', async () => {
    promotionService.fetchPromotions.mockResolvedValue([{ id: 1 }, { id: 2 }])

    const store = usePromotionStore()
    await store.loadPromotions({ category: '海鮮' })

    expect(promotionService.fetchPromotions).toHaveBeenCalledWith({
      category: '海鮮',
      storeSource: '',
      query: '',
      sort: 'recommended',
      page: 0,
    })
    expect(store.promotions).toEqual([{ id: 1 }, { id: 2 }])
    expect(store.hasMore).toBe(true)
  })

  it('sets hasMore to false when a page comes back short', async () => {
    promotionService.fetchPromotions.mockResolvedValue([{ id: 1 }])

    const store = usePromotionStore()
    await store.loadPromotions()

    expect(store.hasMore).toBe(false)
  })

  it('loadMore appends the next page using the same filters', async () => {
    promotionService.fetchPromotions
      .mockResolvedValueOnce([{ id: 1 }, { id: 2 }])
      .mockResolvedValueOnce([{ id: 3 }])

    const store = usePromotionStore()
    await store.loadPromotions({ storeSource: '大全聯', query: '鮭魚', sort: 'price_asc' })
    await store.loadMore()

    expect(promotionService.fetchPromotions).toHaveBeenLastCalledWith({
      category: '',
      storeSource: '大全聯',
      query: '鮭魚',
      sort: 'price_asc',
      page: 1,
    })
    expect(store.promotions).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }])
    expect(store.hasMore).toBe(false)
  })

  it('loadPromotions resets the list and page when filters change', async () => {
    promotionService.fetchPromotions
      .mockResolvedValueOnce([{ id: 1 }, { id: 2 }])
      .mockResolvedValueOnce([{ id: 3 }, { id: 4 }])
      .mockResolvedValueOnce([{ id: 9 }])

    const store = usePromotionStore()
    await store.loadPromotions()
    await store.loadMore()
    await store.loadPromotions({ category: '蔬果' })

    expect(promotionService.fetchPromotions).toHaveBeenLastCalledWith({
      category: '蔬果',
      storeSource: '',
      query: '',
      sort: 'recommended',
      page: 0,
    })
    expect(store.promotions).toEqual([{ id: 9 }])
  })

  it('ignores an older loadPromotions response that resolves after a newer one', async () => {
    const slow = deferred()
    promotionService.fetchPromotions
      .mockReturnValueOnce(slow.promise)
      .mockResolvedValueOnce([{ id: 2 }])

    const store = usePromotionStore()
    const first = store.loadPromotions({ category: '蔬果' })
    await store.loadPromotions({ category: '海鮮' })
    slow.resolve([{ id: 1 }])
    await first

    expect(store.promotions).toEqual([{ id: 2 }])
  })

  it('drops a loadMore response that resolves after the filters changed', async () => {
    const slow = deferred()
    promotionService.fetchPromotions
      .mockResolvedValueOnce([{ id: 1 }, { id: 2 }])
      .mockReturnValueOnce(slow.promise)
      .mockResolvedValueOnce([{ id: 9 }])

    const store = usePromotionStore()
    await store.loadPromotions()
    const more = store.loadMore()
    await store.loadPromotions({ category: '海鮮' })
    slow.resolve([{ id: 3 }])
    await more

    expect(store.promotions).toEqual([{ id: 9 }])
  })

  it('loadLastSyncedAt stores the service value', async () => {
    promotionService.fetchLastSyncedAt.mockResolvedValue('2026-10-01T22:00:00+00:00')

    const store = usePromotionStore()
    await store.loadLastSyncedAt()

    expect(store.lastSyncedAt).toBe('2026-10-01T22:00:00+00:00')
  })

  it('propagates a rejected service call instead of swallowing it', async () => {
    promotionService.fetchPromotions.mockRejectedValue(new Error('network error'))

    const store = usePromotionStore()

    await expect(store.loadPromotions()).rejects.toThrow('network error')
  })
})
