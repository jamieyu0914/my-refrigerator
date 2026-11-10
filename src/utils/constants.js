export const CATEGORIES = ['蔬果', '肉類', '海鮮', '乳製品', '飲品', '其他']

// Where a 特價食材 item is sold - the stored value is the display value, same as CATEGORIES.
// Kept in sync with the promotion_products.store_source check constraint and
// scripts/pxbox/mapProduct.js.
export const STORE_SOURCES = ['全聯全電商', '大全聯']

// 特價食材 sort options - `value` is the key promotionService maps to an ORDER BY.
export const PROMOTION_SORTS = [
  { value: 'recommended', label: '推薦排序' },
  { value: 'price_asc', label: '價格低到高' },
  { value: 'price_desc', label: '價格高到低' },
  { value: 'discount_desc', label: '折扣最多' },
]
