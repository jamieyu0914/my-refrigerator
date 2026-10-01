// Daily 特價食材 sync: crawls 全聯全電商's food/drink categories and writes promotion_products,
// promotion_price_changes and promotion_sync_runs. Run by .github/workflows/sync-pxbox.yml.
//
// Needs SUPABASE_SERVICE_ROLE_KEY plus the project URL, read from SUPABASE_URL or, when that's
// unset, the VITE_SUPABASE_URL the frontend .env already has. The service role key bypasses RLS -
// it only ever lives in GitHub Actions secrets / a local .env, never in the frontend build.
//
// On any failure the run is marked failed and nothing already stored is deleted, so the app
// keeps showing the last successful sync (promotion_deals only reads products seen by it).
import { createClient } from '@supabase/supabase-js'
import { fetchCategoryProducts, REQUEST_INTERVAL_MS, sleep } from './pxbox/client.js'
import {
  buildPriceChanges,
  CRAWL_CATEGORIES,
  isSuspiciouslySmall,
  toProductRow,
  toTaipeiDate,
} from './pxbox/mapProduct.js'

const WRITE_CHUNK_SIZE = 500
const READ_PAGE_SIZE = 1000 // PostgREST's default max rows per request

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const { SUPABASE_SERVICE_ROLE_KEY } = process.env
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY must be set')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

async function startRun() {
  const { data, error } = await supabase
    .from('promotion_sync_runs')
    .insert({})
    .select('id, started_at')
    .single()
  if (error) throw error
  return data
}

async function finishRun(id, payload) {
  const { error } = await supabase
    .from('promotion_sync_runs')
    .update({ ...payload, finished_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

async function getPreviousProductCount() {
  const { data, error } = await supabase
    .from('promotion_sync_runs')
    .select('product_count')
    .eq('status', 'success')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data?.product_count ?? null
}

async function getPreviousPrices() {
  const prices = new Map()
  for (let from = 0; ; from += READ_PAGE_SIZE) {
    const { data, error } = await supabase
      .from('promotion_products')
      .select('id, sale_price')
      .order('id')
      .range(from, from + READ_PAGE_SIZE - 1)
    if (error) throw error
    for (const row of data) prices.set(row.id, row.sale_price)
    if (data.length < READ_PAGE_SIZE) return prices
  }
}

async function upsertInChunks(table, rows, onConflict) {
  for (let i = 0; i < rows.length; i += WRITE_CHUNK_SIZE) {
    const { error } = await supabase
      .from(table)
      .upsert(rows.slice(i, i + WRITE_CHUNK_SIZE), { onConflict })
    if (error) throw error
  }
}

async function crawl(seenAt) {
  // The same product can be listed under several categories - keep the first one seen.
  const rowsById = new Map()
  for (const category of CRAWL_CATEGORIES) {
    const products = await fetchCategoryProducts(category.id)
    let skipped = 0
    for (const product of products) {
      const row = toProductRow(product, category, seenAt)
      if (!row) skipped++
      else if (!rowsById.has(row.id)) rowsById.set(row.id, row)
    }
    console.log(`${category.name}: ${products.length} products${skipped ? `, ${skipped} skipped` : ''}`)
    await sleep(REQUEST_INTERVAL_MS)
  }
  return [...rowsById.values()]
}

async function main() {
  const run = await startRun()
  console.log(`sync run ${run.id} started at ${run.started_at}`)

  try {
    const rows = await crawl(run.started_at)

    const previousCount = await getPreviousProductCount()
    if (isSuspiciouslySmall(rows.length, previousCount)) {
      throw new Error(`only ${rows.length} products (previous run: ${previousCount}) - not saving`)
    }

    const previousPrices = await getPreviousPrices()
    const observedOn = toTaipeiDate(new Date(run.started_at))
    const priceChanges = buildPriceChanges(rows, previousPrices, observedOn)

    // Products first: promotion_price_changes.product_id references them.
    await upsertInChunks('promotion_products', rows, 'id')
    await upsertInChunks('promotion_price_changes', priceChanges, 'product_id,observed_on')

    await finishRun(run.id, { status: 'success', product_count: rows.length })
    console.log(`done: ${rows.length} products, ${priceChanges.length} price changes`)
  } catch (error) {
    console.error(error)
    await finishRun(run.id, { status: 'failed', error: String(error?.message ?? error) })
    process.exitCode = 1
  }
}

await main()
