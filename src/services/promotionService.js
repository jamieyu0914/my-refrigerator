import { getItems, getLatestSuccessfulSyncRun } from '../repositories/promotionRepository'

export const PROMOTION_PAGE_SIZE = 20

const PRODUCT_URL = 'https://pxbox.es.pxmart.com.tw/product/'

// Keyed by utils/constants.js PROMOTION_SORTS values.
const SORT_ORDERS = {
  recommended: [
    ['deal_rank', { ascending: true }],
    ['discount_rate', { ascending: false, nullsFirst: false }],
  ],
  price_asc: [['sale_price', { ascending: true }]],
  price_desc: [['sale_price', { ascending: false }]],
  discount_desc: [['discount_rate', { ascending: false, nullsFirst: false }]],
}

// id breaks ties (many products share a price) so pages never overlap or skip rows.
function toOrder(sort) {
  return [...(SORT_ORDERS[sort] ?? SORT_ORDERS.recommended), ['id', { ascending: true }]]
}

// Substring match on the name; the user's own % _ \ are matched literally, not as wildcards.
function toNamePattern(query) {
  if (!query) return null
  return `%${query.replace(/[\\%_]/g, '\\$&')}%`
}

function toBadges(row) {
  const badges = []
  if (row.is_price_drop) badges.push('price_drop')
  if (row.is_discount_price) badges.push('discount_price')
  if (row.is_deep_discount) badges.push('deep_discount')
  return badges
}

function toPromotion(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category_code,
    sourceCategory: row.source_category,
    storeSource: row.store_source,
    salePrice: row.sale_price,
    marketPrice: row.market_price,
    discountRate: row.discount_rate === null ? null : Number(row.discount_rate),
    referencePrice: row.reference_price,
    badges: toBadges(row),
    imageUrl: row.image_url,
    productUrl: `${PRODUCT_URL}${row.id}`,
    lastSeenAt: row.last_seen_at,
  }
}

export async function fetchPromotions({
  category = '',
  storeSource = '',
  query = '',
  sort = 'recommended',
  page = 0,
} = {}) {
  const from = page * PROMOTION_PAGE_SIZE
  const rows = await getItems({
    categoryCode: category || null,
    storeSource: storeSource || null,
    namePattern: toNamePattern(query),
    order: toOrder(sort),
    from,
    to: from + PROMOTION_PAGE_SIZE - 1,
  })
  return rows.map(toPromotion)
}

export async function fetchLastSyncedAt() {
  const run = await getLatestSuccessfulSyncRun()
  return run?.started_at ?? null
}
