import { supabase } from '../services/supabaseClient'

// promotion_deals is a read-only view over promotion_products (see
// supabase/migrations/20261001000000_promotion_products.sql) - rows are written only by
// scripts/sync-pxbox.mjs, so there's nothing to create/update/delete here.
// `order` is a list of [column, options] pairs, applied in sequence.
export async function getItems({ categoryCode, storeSource, namePattern, order, from, to }) {
  let query = supabase.from('promotion_deals').select('*')
  if (categoryCode) query = query.eq('category_code', categoryCode)
  if (storeSource) query = query.eq('store_source', storeSource)
  if (namePattern) query = query.ilike('name', namePattern)
  for (const [column, options] of order) query = query.order(column, options)

  const { data, error } = await query.range(from, to)

  if (error) throw error
  return data
}

export async function getLatestSuccessfulSyncRun() {
  const { data, error } = await supabase
    .from('promotion_sync_runs')
    .select('started_at')
    .eq('status', 'success')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}
