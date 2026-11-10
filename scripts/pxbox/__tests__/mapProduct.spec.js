import { describe, expect, it } from 'vitest'
import {
  buildPriceChanges,
  CRAWL_CATEGORIES,
  isSuspiciouslySmall,
  toCategoryCode,
  toProductRow,
  toStoreSource,
  toTaipeiDate,
} from '../mapProduct'
import { CATEGORIES, STORE_SOURCES } from '../../../src/utils/constants'

const COLD_CHAIN = CRAWL_CATEGORIES.find((c) => c.name === '冷藏冷凍')
const DAIRY = CRAWL_CATEGORIES.find((c) => c.name === '乳品')
const SEEN_AT = '2026-10-01T22:00:00+00:00'

// Shaped like one entry of get_products' data.product_list, trimmed to the fields we read.
function apiProduct(overrides = {}) {
  return {
    id: 917355,
    product_name: '  【溪和水產】海味精選組(任選3件)  ',
    sale_price: 1070,
    market_price: 1120,
    is_discount_price: true,
    sale_price_tag: '折後價',
    picture: 'https://b2eimg.pxec.com.tw/a.jpg',
    first_product_picture: 'https://b2eimg.pxec.com.tw/b.jpg',
    is_sold_out: false,
    product_categories: [
      {
        d1_category_id: 535,
        d1_category_name: '食品/料理',
        d2_category_name: '冷藏冷凍',
        d3_category_name: '海鮮類',
      },
    ],
    ...overrides,
  }
}

describe('toCategoryCode', () => {
  it.each([
    [{ rootId: 535, d2Name: '生鮮蔬果', d3Name: '季節水果' }, '蔬果'],
    [{ rootId: 535, d2Name: '生鮮蔬果', d3Name: '雞蛋/蛋品' }, '其他'],
    [{ rootId: 535, d2Name: '冷藏冷凍', d3Name: '精肉類' }, '肉類'],
    [{ rootId: 535, d2Name: '冷藏冷凍', d3Name: '海鮮類' }, '海鮮'],
    [{ rootId: 535, d2Name: '冷藏冷凍', d3Name: '起士奶油' }, '乳製品'],
    [{ rootId: 535, d2Name: '冷藏冷凍', d3Name: '水餃點心類' }, '其他'],
    [{ rootId: 500, d2Name: '乳品', d3Name: '' }, '乳製品'],
    [{ rootId: 500, d2Name: '奶粉', d3Name: '' }, '乳製品'],
    [{ rootId: 500, d2Name: '豆奶/燕麥奶', d3Name: '' }, '飲品'],
    [{ rootId: 500, d2Name: '果汁/蔬果', d3Name: '' }, '飲品'],
    [{ rootId: 535, d2Name: '油品調味', d3Name: '醬油' }, '其他'],
  ])('maps %o to %s', (path, expected) => {
    expect(toCategoryCode(path)).toBe(expected)
  })

  it('only ever returns a value from CATEGORIES', () => {
    for (const category of CRAWL_CATEGORIES) {
      const code = toCategoryCode({ rootId: category.rootId, d2Name: category.name, d3Name: '' })
      expect(CATEGORIES).toContain(code)
    }
  })
})

describe('toStoreSource', () => {
  it('is 大全聯 when any category entry sits under the 大全聯 tree', () => {
    expect(
      toStoreSource([
        { d1_category_id: 535, d2_category_name: '餅乾' },
        { d1_category_id: 2284, d2_category_name: '食品/料理' },
      ]),
    ).toBe('大全聯')
  })

  it('is 全聯全電商 otherwise', () => {
    expect(toStoreSource([{ d1_category_id: 535 }])).toBe('全聯全電商')
    expect(toStoreSource([])).toBe('全聯全電商')
  })

  it('only ever returns a value from STORE_SOURCES', () => {
    expect(STORE_SOURCES).toContain(toStoreSource([{ d1_category_id: 2284 }]))
    expect(STORE_SOURCES).toContain(toStoreSource([]))
  })
})

describe('toProductRow', () => {
  it('maps an API product to a snake_case promotion_products row', () => {
    expect(toProductRow(apiProduct(), COLD_CHAIN, SEEN_AT)).toEqual({
      id: 917355,
      name: '【溪和水產】海味精選組(任選3件)',
      category_code: '海鮮',
      source_category: '冷藏冷凍>海鮮類',
      store_source: '全聯全電商',
      sale_price: 1070,
      market_price: 1120,
      is_discount_price: true,
      sale_price_tag: '折後價',
      image_url: 'https://b2eimg.pxec.com.tw/a.jpg',
      is_sold_out: false,
      last_seen_at: SEEN_AT,
    })
  })

  it('uses the food/drink category entry, not the 大全聯 one, for category mapping', () => {
    const row = toProductRow(
      apiProduct({
        product_categories: [
          { d1_category_id: 2284, d2_category_name: '食品/料理', d3_category_name: '' },
          { d1_category_id: 500, d2_category_name: '乳品', d3_category_name: '鮮乳' },
        ],
      }),
      DAIRY,
      SEEN_AT,
    )

    expect(row.category_code).toBe('乳製品')
    expect(row.source_category).toBe('乳品>鮮乳')
    expect(row.store_source).toBe('大全聯')
  })

  it('falls back to the crawled category when the product has no food/drink entry', () => {
    const row = toProductRow(apiProduct({ product_categories: undefined }), DAIRY, SEEN_AT)

    expect(row.category_code).toBe('乳製品')
    expect(row.source_category).toBe('乳品')
  })

  it('normalizes missing optional fields to null and missing flags to false', () => {
    const row = toProductRow(
      apiProduct({
        market_price: 0,
        sale_price_tag: '',
        picture: '',
        first_product_picture: null,
        is_discount_price: undefined,
        is_sold_out: undefined,
      }),
      COLD_CHAIN,
      SEEN_AT,
    )

    expect(row.market_price).toBeNull()
    expect(row.sale_price_tag).toBeNull()
    expect(row.image_url).toBeNull()
    expect(row.is_discount_price).toBe(false)
    expect(row.is_sold_out).toBe(false)
  })

  it('falls back to first_product_picture and rounds prices to integers', () => {
    const row = toProductRow(
      apiProduct({ picture: null, sale_price: '99.6', market_price: 120.2 }),
      COLD_CHAIN,
      SEEN_AT,
    )

    expect(row.image_url).toBe('https://b2eimg.pxec.com.tw/b.jpg')
    expect(row.sale_price).toBe(100)
    expect(row.market_price).toBe(120)
  })

  it.each([
    ['a non-integer id', { id: '917355' }],
    ['an empty name', { product_name: '   ' }],
    ['a missing name', { product_name: null }],
    ['a non-numeric sale price', { sale_price: 'abc' }],
    ['a negative sale price', { sale_price: -1 }],
  ])('returns null for %s', (_, overrides) => {
    expect(toProductRow(apiProduct(overrides), COLD_CHAIN, SEEN_AT)).toBeNull()
  })
})

describe('buildPriceChanges', () => {
  const rows = [
    { id: 1, sale_price: 100, market_price: 150 },
    { id: 2, sale_price: 80, market_price: null },
    { id: 3, sale_price: 50, market_price: 60 },
  ]

  it('records new products and products whose sale_price changed, skipping unchanged ones', () => {
    const previous = new Map([
      [1, 100],
      [2, 90],
    ])

    expect(buildPriceChanges(rows, previous, '2026-10-02')).toEqual([
      { product_id: 2, observed_on: '2026-10-02', sale_price: 80, market_price: null },
      { product_id: 3, observed_on: '2026-10-02', sale_price: 50, market_price: 60 },
    ])
  })
})

describe('isSuspiciouslySmall', () => {
  it('rejects an empty crawl even on the very first run', () => {
    expect(isSuspiciouslySmall(0, null)).toBe(true)
  })

  it('accepts any non-empty first run', () => {
    expect(isSuspiciouslySmall(10, null)).toBe(false)
  })

  it('rejects a crawl less than half the size of the previous one', () => {
    expect(isSuspiciouslySmall(4999, 10000)).toBe(true)
    expect(isSuspiciouslySmall(5000, 10000)).toBe(false)
  })
})

describe('toTaipeiDate', () => {
  it('uses the Asia/Taipei calendar date, not UTC', () => {
    // 22:00 UTC on Oct 1 is already 06:00 on Oct 2 in Taipei
    expect(toTaipeiDate(new Date('2026-10-01T22:00:00Z'))).toBe('2026-10-02')
    expect(toTaipeiDate(new Date('2026-10-01T15:59:59Z'))).toBe('2026-10-01')
  })
})
