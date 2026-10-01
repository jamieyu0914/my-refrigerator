// Reads 全聯全電商's product list API - the same unauthenticated endpoint the site's own
// category pages call from the browser. It's undocumented, so anything unexpected in a response
// throws instead of being guessed at; the caller then marks the sync as failed and keeps the
// previous data.

export const API_URL = 'https://api-pxbox.es.pxmart.com.tw/app/2.0/spu/get_products'
export const PAGE_SIZE = 100
export const REQUEST_INTERVAL_MS = 1000 // one request per second - be a polite crawler
const MAX_ATTEMPTS = 3

const HEADERS = {
  'User-Agent': 'my-refrigerator-sync/1.0 (+https://github.com/jamieyu0914/my-refrigerator)',
  Referer: 'https://pxbox.es.pxmart.com.tw/',
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchPage(categoryId, pageIndex, { fetchImpl, wait }) {
  const query = new URLSearchParams({
    CategoryId: String(categoryId),
    depth: '2',
    SortType: '0',
    PageIndex: String(pageIndex),
    PageSize: String(PAGE_SIZE),
    SrcPage: '2',
  })

  let lastError
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetchImpl(`${API_URL}?${query}`, { headers: HEADERS })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const body = await response.json()
      if (body?.code !== '0000' || !Array.isArray(body?.data?.product_list)) {
        throw new Error(`unexpected response: code=${body?.code} message=${body?.message}`)
      }
      return body.data
    } catch (error) {
      lastError = error
      if (attempt < MAX_ATTEMPTS) await wait(REQUEST_INTERVAL_MS * 2 ** attempt)
    }
  }

  throw new Error(`category ${categoryId} page ${pageIndex}: ${lastError.message}`)
}

/**
 * Every product in one second-level category, following total_page.
 * @returns {Promise<object[]>} raw product_list entries
 */
export async function fetchCategoryProducts(categoryId, { fetchImpl = fetch, wait = sleep } = {}) {
  const products = []
  let pageIndex = 1

  while (true) {
    const data = await fetchPage(categoryId, pageIndex, { fetchImpl, wait })
    products.push(...data.product_list)
    if (pageIndex >= (data.total_page ?? 1)) break
    pageIndex++
    await wait(REQUEST_INTERVAL_MS)
  }

  return products
}
