import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchLastSyncedAt, fetchPromotions, PROMOTION_PAGE_SIZE } from '../promotionService'
import * as repository from '../../repositories/promotionRepository'
import { PROMOTION_SORTS } from '../../utils/constants'

vi.mock('../../repositories/promotionRepository', () => ({
  getItems: vi.fn(),
  getLatestSuccessfulSyncRun: vi.fn(),
}))

// A promotion_deals row exactly as PostgREST returns it.
function dealRow(overrides = {}) {
  return {
    id: 917355,
    name: '【溪和水產】海味精選組(任選3件)',
    category_code: '海鮮',
    source_category: '冷藏冷凍>海鮮類',
    store_source: '全聯全電商',
    sale_price: 1070,
    market_price: 1120,
    discount_rate: 0.0446,
    reference_price: null,
    is_price_drop: false,
    is_discount_price: true,
    is_deep_discount: false,
    deal_rank: 2,
    image_url: 'https://b2eimg.pxec.com.tw/a.jpg',
    last_seen_at: '2026-10-01T22:00:00+00:00',
    ...overrides,
  }
}

describe('promotionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetchPromotions maps snake_case rows to camelCase Promotion objects', async () => {
    repository.getItems.mockResolvedValue([dealRow()])

    const promotions = await fetchPromotions()

    expect(promotions).toEqual([
      {
        id: 917355,
        name: '【溪和水產】海味精選組(任選3件)',
        category: '海鮮',
        sourceCategory: '冷藏冷凍>海鮮類',
        storeSource: '全聯全電商',
        salePrice: 1070,
        marketPrice: 1120,
        discountRate: 0.0446,
        referencePrice: null,
        badges: ['discount_price'],
        imageUrl: 'https://b2eimg.pxec.com.tw/a.jpg',
        productUrl: 'https://pxbox.es.pxmart.com.tw/product/917355',
        lastSeenAt: '2026-10-01T22:00:00+00:00',
      },
    ])
  })

  it('orders badges price_drop, discount_price, deep_discount', async () => {
    repository.getItems.mockResolvedValue([
      dealRow({ is_price_drop: true, is_discount_price: true, is_deep_discount: true }),
    ])

    const [promotion] = await fetchPromotions()

    expect(promotion.badges).toEqual(['price_drop', 'discount_price', 'deep_discount'])
  })

  it('keeps null discount_rate/market_price as null and coerces a string numeric', async () => {
    repository.getItems.mockResolvedValue([
      dealRow({ discount_rate: null, market_price: null, image_url: null }),
      dealRow({ id: 2, discount_rate: '0.3500' }),
    ])

    const [withoutMarket, withStringRate] = await fetchPromotions()

    expect(withoutMarket.discountRate).toBeNull()
    expect(withoutMarket.marketPrice).toBeNull()
    expect(withoutMarket.imageUrl).toBeNull()
    expect(withStringRate.discountRate).toBe(0.35)
  })

  it('fetchPromotions translates page and filters into a repository range query', async () => {
    repository.getItems.mockResolvedValue([])

    await fetchPromotions({ category: '海鮮', storeSource: '大全聯', query: '鮭魚', page: 2 })

    expect(repository.getItems).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryCode: '海鮮',
        storeSource: '大全聯',
        namePattern: '%鮭魚%',
        from: 2 * PROMOTION_PAGE_SIZE,
        to: 3 * PROMOTION_PAGE_SIZE - 1,
      }),
    )
  })

  it('fetchPromotions passes empty filters as null and defaults to the recommended order', async () => {
    repository.getItems.mockResolvedValue([])

    await fetchPromotions({ category: '', storeSource: '', query: '' })

    expect(repository.getItems).toHaveBeenCalledWith({
      categoryCode: null,
      storeSource: null,
      namePattern: null,
      order: [
        ['deal_rank', { ascending: true }],
        ['discount_rate', { ascending: false, nullsFirst: false }],
        ['id', { ascending: true }],
      ],
      from: 0,
      to: PROMOTION_PAGE_SIZE - 1,
    })
  })

  it.each([
    ['price_asc', [['sale_price', { ascending: true }]]],
    ['price_desc', [['sale_price', { ascending: false }]]],
    ['discount_desc', [['discount_rate', { ascending: false, nullsFirst: false }]]],
  ])('maps sort %s to its order, with id as the tie-breaker', async (sort, expected) => {
    repository.getItems.mockResolvedValue([])

    await fetchPromotions({ sort })

    expect(repository.getItems.mock.calls[0][0].order).toEqual([
      ...expected,
      ['id', { ascending: true }],
    ])
  })

  it('falls back to the recommended order for an unknown sort', async () => {
    repository.getItems.mockResolvedValue([])

    await fetchPromotions({ sort: 'nope' })

    expect(repository.getItems.mock.calls[0][0].order[0]).toEqual(['deal_rank', { ascending: true }])
  })

  it('escapes LIKE wildcards in the search query so they match literally', async () => {
    repository.getItems.mockResolvedValue([])

    await fetchPromotions({ query: '100%_純\\果汁' })

    expect(repository.getItems.mock.calls[0][0].namePattern).toBe('%100\\%\\_純\\\\果汁%')
  })

  it('every PROMOTION_SORTS option has a matching order', async () => {
    repository.getItems.mockResolvedValue([])

    for (const { value } of PROMOTION_SORTS) {
      await fetchPromotions({ sort: value })
    }

    const firstColumns = repository.getItems.mock.calls.map((call) => call[0].order[0][0])
    expect(firstColumns).toEqual(['deal_rank', 'sale_price', 'sale_price', 'discount_rate'])
  })

  it('fetchLastSyncedAt returns the latest successful run start, or null before any sync', async () => {
    repository.getLatestSuccessfulSyncRun.mockResolvedValueOnce({
      started_at: '2026-10-01T22:00:00+00:00',
    })
    repository.getLatestSuccessfulSyncRun.mockResolvedValueOnce(null)

    expect(await fetchLastSyncedAt()).toBe('2026-10-01T22:00:00+00:00')
    expect(await fetchLastSyncedAt()).toBeNull()
  })

  it('propagates repository errors', async () => {
    repository.getItems.mockRejectedValue(new Error('network error'))

    await expect(fetchPromotions()).rejects.toThrow('network error')
  })
})
