import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createItem,
  deleteItem,
  getItemById,
  getItems,
  updateItem,
} from '../refrigeratorRepository'
import { supabase } from '../../services/supabaseClient'

vi.mock('../../services/supabaseClient', () => ({
  supabase: { from: vi.fn() },
}))

// supabase-js query builders are chainable AND thenable - every method below returns the same
// builder so call order doesn't matter, and `await`ing it resolves via `then` with whatever
// {data, error} shape a test configures, exactly like a real query resolves.
function mockQuery(result) {
  const builder = {}
  for (const method of ['select', 'order', 'eq', 'insert', 'update', 'delete', 'single']) {
    builder[method] = vi.fn(() => builder)
  }
  builder.then = (resolve) => resolve(result)
  supabase.from.mockReturnValue(builder)
  return builder
}

describe('refrigeratorRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getItems selects all foods ordered by expiry_date ascending', async () => {
    const rows = [{ id: '1', name: '牛奶' }]
    const builder = mockQuery({ data: rows, error: null })

    const result = await getItems()

    expect(supabase.from).toHaveBeenCalledWith('foods')
    expect(builder.select).toHaveBeenCalledWith('*')
    expect(builder.order).toHaveBeenCalledWith('expiry_date', { ascending: true })
    expect(result).toEqual(rows)
  })

  it('getItems throws when supabase returns an error', async () => {
    mockQuery({ data: null, error: new Error('boom') })

    await expect(getItems()).rejects.toThrow('boom')
  })

  it('getItemById selects a single food by id', async () => {
    const row = { id: '1', name: '牛奶' }
    const builder = mockQuery({ data: row, error: null })

    const result = await getItemById('1')

    expect(builder.select).toHaveBeenCalledWith('*')
    expect(builder.eq).toHaveBeenCalledWith('id', '1')
    expect(builder.single).toHaveBeenCalled()
    expect(result).toEqual(row)
  })

  it('getItemById throws when supabase returns an error', async () => {
    mockQuery({ data: null, error: new Error('not found') })

    await expect(getItemById('missing')).rejects.toThrow('not found')
  })

  it('createItem inserts a row and returns the created record', async () => {
    const row = { name: '雞蛋' }
    const created = { id: '2', name: '雞蛋' }
    const builder = mockQuery({ data: created, error: null })

    const result = await createItem(row)

    expect(builder.insert).toHaveBeenCalledWith(row)
    expect(builder.single).toHaveBeenCalled()
    expect(result).toEqual(created)
  })

  it('createItem throws when supabase returns an error', async () => {
    mockQuery({ data: null, error: new Error('insert failed') })

    await expect(createItem({})).rejects.toThrow('insert failed')
  })

  it('updateItem updates a row by id and returns the updated record', async () => {
    const updated = { id: '3', quantity: 2 }
    const builder = mockQuery({ data: updated, error: null })

    const result = await updateItem('3', { quantity: 2 })

    expect(builder.update).toHaveBeenCalledWith({ quantity: 2 })
    expect(builder.eq).toHaveBeenCalledWith('id', '3')
    expect(builder.single).toHaveBeenCalled()
    expect(result).toEqual(updated)
  })

  it('updateItem throws when supabase returns an error', async () => {
    mockQuery({ data: null, error: new Error('update failed') })

    await expect(updateItem('3', {})).rejects.toThrow('update failed')
  })

  it('deleteItem deletes a row by id', async () => {
    const builder = mockQuery({ error: null })

    await deleteItem('4')

    expect(builder.delete).toHaveBeenCalled()
    expect(builder.eq).toHaveBeenCalledWith('id', '4')
  })

  it('deleteItem throws when supabase returns an error', async () => {
    mockQuery({ error: new Error('delete failed') })

    await expect(deleteItem('4')).rejects.toThrow('delete failed')
  })
})
