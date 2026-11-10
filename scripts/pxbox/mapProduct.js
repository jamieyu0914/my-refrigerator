// Turns one product from 全聯全電商's get_products API into a promotion_products row.
// Pure functions only - no network or database access - so they can be unit tested.

const FOOD_ROOT_ID = 535 // 食品/料理
const DRINK_ROOT_ID = 500 // 飲料/沖調
const PXMART_MEGA_ROOT_ID = 2284 // 大全聯

// Every second-level category under 食品/料理 and 飲料/沖調. Crawled one by one (depth=2)
// because querying a top-level category caps out at 10,000 results. Every 大全聯 food/drink
// product is also listed under one of these, so the 大全聯 tree needs no crawl of its own.
export const CRAWL_CATEGORIES = [
  { id: 536, name: '糖果/果凍', rootId: FOOD_ROOT_ID },
  { id: 540, name: '餅乾', rootId: FOOD_ROOT_ID },
  { id: 544, name: '休閒零食', rootId: FOOD_ROOT_ID },
  { id: 552, name: '油品調味', rootId: FOOD_ROOT_ID },
  { id: 560, name: '烘焙食材', rootId: FOOD_ROOT_ID },
  { id: 565, name: '南北乾貨', rootId: FOOD_ROOT_ID },
  { id: 569, name: '米', rootId: FOOD_ROOT_ID },
  { id: 572, name: '冬粉/米粉', rootId: FOOD_ROOT_ID },
  { id: 573, name: '麵/泡麵', rootId: FOOD_ROOT_ID },
  { id: 577, name: '有機食品', rootId: FOOD_ROOT_ID },
  { id: 1292, name: '冷藏冷凍', rootId: FOOD_ROOT_ID },
  { id: 1846, name: '生鮮蔬果', rootId: FOOD_ROOT_ID },
  { id: 1847, name: '蛋糕甜點', rootId: FOOD_ROOT_ID },
  { id: 501, name: '水', rootId: DRINK_ROOT_ID },
  { id: 505, name: '乳品', rootId: DRINK_ROOT_ID },
  { id: 506, name: '豆奶/燕麥奶', rootId: DRINK_ROOT_ID },
  { id: 507, name: '瓶裝茶/奶茶', rootId: DRINK_ROOT_ID },
  { id: 508, name: '碳酸飲料/汽水', rootId: DRINK_ROOT_ID },
  { id: 509, name: '咖啡', rootId: DRINK_ROOT_ID },
  { id: 510, name: '運動/提神飲料', rootId: DRINK_ROOT_ID },
  { id: 511, name: '果汁/蔬果', rootId: DRINK_ROOT_ID },
  { id: 512, name: '養生飲品', rootId: DRINK_ROOT_ID },
  { id: 513, name: '即飲甜品', rootId: DRINK_ROOT_ID },
  { id: 514, name: '茶葉茶包', rootId: DRINK_ROOT_ID },
  { id: 517, name: '沖泡咖啡', rootId: DRINK_ROOT_ID },
  { id: 526, name: '奶粉', rootId: DRINK_ROOT_ID },
  { id: 1687, name: '滴雞精', rootId: DRINK_ROOT_ID },
  { id: 1748, name: '沖泡', rootId: DRINK_ROOT_ID },
]

const COLD_CHAIN_CATEGORIES = {
  精肉類: '肉類',
  海鮮類: '海鮮',
  起士奶油: '乳製品',
}

const DAIRY_CATEGORIES = new Set(['乳品', '奶粉'])

// Maps the site's category path to one of src/utils/constants.js CATEGORIES.
export function toCategoryCode({ rootId, d2Name, d3Name }) {
  if (d2Name === '生鮮蔬果') return d3Name === '雞蛋/蛋品' ? '其他' : '蔬果'
  if (d2Name === '冷藏冷凍') return COLD_CHAIN_CATEGORIES[d3Name] ?? '其他'
  if (DAIRY_CATEGORIES.has(d2Name)) return '乳製品'
  if (rootId === DRINK_ROOT_ID) return '飲品'
  return '其他'
}

// Must match src/utils/constants.js STORE_SOURCES and the store_source check constraint.
export function toStoreSource(productCategories) {
  return productCategories.some((c) => c.d1_category_id === PXMART_MEGA_ROOT_ID)
    ? '大全聯'
    : '全聯全電商'
}

function toPrice(value) {
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? Math.round(number) : null
}

/**
 * @param {object} product - one entry of get_products' data.product_list
 * @param {{ id: number, name: string, rootId: number }} crawledCategory - one of CRAWL_CATEGORIES,
 *   the category it was crawled from
 * @param {string} seenAt - ISO timestamp of the sync run
 * @returns {object|null} a promotion_products row, or null when the product is unusable
 */
export function toProductRow(product, crawledCategory, seenAt) {
  const name = typeof product.product_name === 'string' ? product.product_name.trim() : ''
  const salePrice = toPrice(product.sale_price)
  if (!Number.isInteger(product.id) || !name || salePrice === null) return null

  const productCategories = Array.isArray(product.product_categories)
    ? product.product_categories
    : []
  const sourceEntry = productCategories.find(
    (c) => c.d1_category_id === FOOD_ROOT_ID || c.d1_category_id === DRINK_ROOT_ID,
  )
  const rootId = sourceEntry?.d1_category_id ?? crawledCategory.rootId
  const d2Name = sourceEntry?.d2_category_name || crawledCategory.name
  const d3Name = sourceEntry?.d3_category_name || ''

  const marketPrice = toPrice(product.market_price)

  return {
    id: product.id,
    name,
    category_code: toCategoryCode({ rootId, d2Name, d3Name }),
    source_category: [d2Name, d3Name].filter(Boolean).join('>'),
    store_source: toStoreSource(productCategories),
    sale_price: salePrice,
    market_price: marketPrice > 0 ? marketPrice : null,
    is_discount_price: product.is_discount_price === true,
    sale_price_tag: product.sale_price_tag || null,
    image_url: product.picture || product.first_product_picture || null,
    is_sold_out: product.is_sold_out === true,
    last_seen_at: seenAt,
  }
}

/**
 * Rows for promotion_price_changes: a product gets one only when it's new or its sale_price
 * differs from what the previous sync stored.
 * @param {Map<number, number>} previousPrices - product id -> sale_price before this sync
 */
export function buildPriceChanges(rows, previousPrices, observedOn) {
  return rows
    .filter((row) => previousPrices.get(row.id) !== row.sale_price)
    .map((row) => ({
      product_id: row.id,
      observed_on: observedOn,
      sale_price: row.sale_price,
      market_price: row.market_price,
    }))
}

// A sync that suddenly sees far fewer products almost certainly hit a site change or an
// API failure, not a real catalog shrink - refuse to treat it as the new truth.
export const MIN_PRODUCT_RATIO = 0.5

export function isSuspiciouslySmall(productCount, previousProductCount) {
  if (productCount === 0) return true
  if (!previousProductCount) return false
  return productCount < previousProductCount * MIN_PRODUCT_RATIO
}

// 'YYYY-MM-DD' in Asia/Taipei, matching the view's (now() at time zone 'Asia/Taipei')::date.
export function toTaipeiDate(date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei' }).format(date)
}
