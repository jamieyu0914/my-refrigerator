import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getItems, getLatestSuccessfulSyncRun } from '../promotionRepository'
import { supabase } from '../../services/supabaseClient'

vi.mock('../../services/supabaseClient', () => ({
  supabase: { from: vi.fn() },
}))

// Same chainable + thenable builder as refrigeratorRepository.spec.js.
function mockQuery(result) {
  const builder = {}
  for (const method of ['select', 'eq', 'ilike', 'order', 'range', 'limit', 'maybeSingle']) {
    builder[method] = vi.fn(() => builder)
  }
  builder.then = (resolve) => resolve(result)
  supabase.from.mockReturnValue(builder)
  return builder
}

describe('promotionRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getItems reads one page of promotion_deals in the given order', async () => {
    const rows = [{ id: 1, name: '鮮乳' }]
    const builder = mockQuery({ data: rows, error: null })
    const order = [
      ['sale_price', { ascending: true }],
      ['id', { ascending: true }],
    ]

    const result = await getItems({
      categoryCode: null,
      storeSource: null,
      namePattern: null,
      order,
      from: 20,
      to: 39,
    })

    expect(supabase.from).toHaveBeenCalledWith('promotion_deals')
    expect(builder.select).toHaveBeenCalledWith('*')
    expect(builder.eq).not.toHaveBeenCalled()
    expect(builder.ilike).not.toHaveBeenCalled()
    expect(builder.order.mock.calls).toEqual(order)
    expect(builder.range).toHaveBeenCalledWith(20, 39)
    expect(result).toEqual(rows)
  })

  it('getItems filters by category, store source and name pattern when given', async () => {
    const builder = mockQuery({ data: [], error: null })

    await getItems({
      categoryCode: '海鮮',
      storeSource: '大全聯',
      namePattern: '%鮭魚%',
      order: [],
      from: 0,
      to: 19,
    })

    expect(builder.eq).toHaveBeenCalledWith('category_code', '海鮮')
    expect(builder.eq).toHaveBeenCalledWith('store_source', '大全聯')
    expect(builder.ilike).toHaveBeenCalledWith('name', '%鮭魚%')
  })

  it('getItems throws when supabase returns an error', async () => {
    mockQuery({ data: null, error: new Error('boom') })

    await expect(getItems({ order: [], from: 0, to: 19 })).rejects.toThrow('boom')
  })

  it('getLatestSuccessfulSyncRun reads the newest successful run', async () => {
    const builder = mockQuery({ data: { started_at: '2026-10-01T22:00:00+00:00' }, error: null })

    const result = await getLatestSuccessfulSyncRun()

    expect(supabase.from).toHaveBeenCalledWith('promotion_sync_runs')
    expect(builder.select).toHaveBeenCalledWith('started_at')
    expect(builder.eq).toHaveBeenCalledWith('status', 'success')
    expect(builder.order).toHaveBeenCalledWith('started_at', { ascending: false })
    expect(builder.limit).toHaveBeenCalledWith(1)
    expect(builder.maybeSingle).toHaveBeenCalled()
    expect(result).toEqual({ started_at: '2026-10-01T22:00:00+00:00' })
  })

  it('getLatestSuccessfulSyncRun throws when supabase returns an error', async () => {
    mockQuery({ data: null, error: new Error('denied') })

    await expect(getLatestSuccessfulSyncRun()).rejects.toThrow('denied')
  })
})
