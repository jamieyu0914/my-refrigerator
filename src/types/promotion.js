/**
 * @typedef {'price_drop'|'discount_price'|'deep_discount'} PromotionBadge
 * price_drop: lower than the 30-day low/average before the current price started
 * discount_price: the site's own 折後價 flag (is_discount_price)
 * deep_discount: sale price at least 30% below the site's strikethrough price
 */

/**
 * @typedef {Object} Promotion
 * @property {number} id - 全聯全電商 product id, not a uuid
 * @property {string} name
 * @property {string} category - one of utils/constants.js CATEGORIES
 * @property {string} sourceCategory - the site's own category path, e.g. '冷藏冷凍>海鮮類'
 * @property {string} storeSource - one of utils/constants.js STORE_SOURCES
 * @property {number} salePrice
 * @property {number|null} marketPrice - the site's strikethrough price
 * @property {number|null} discountRate - 0-1, salePrice vs marketPrice
 * @property {number|null} referencePrice - time-weighted average price of the 30 days before the current price; only set with a price_drop badge
 * @property {PromotionBadge[]} badges - ordered most to least significant
 * @property {string|null} imageUrl
 * @property {string} productUrl
 * @property {string} lastSeenAt
 */

export {}
