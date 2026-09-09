import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  deleteShoppingItem,
  fetchShoppingItems,
  insertShoppingItem,
  updateShoppingItem,
} from '../shoppingListService'
import * as repository from '../../repositories/shoppingListRepository'
import { getCurrentUserId } from '../supabaseClient'

vi.mock('../supabaseClient', () => ({
  getCurrentUserId: vi.fn(),
}))

vi.mock('../../repositories/shoppingListRepository', () => ({
  getItems: vi.fn(),
  createItem: vi.fn(),
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
}))

describe('shoppingListService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetchShoppingItems maps snake_case rows to camelCase ShoppingItem objects', async () => {
    repository.getItems.mockResolvedValue([
      {
        id: '1',
        name: '牛奶',
        quantity: 2,
        unit: '瓶',
        category_code: '乳製品',
        purchased: false,
        created_at: '2026-09-01T00:00:00Z',
        updated_at: '2026-09-01T00:00:00Z',
      },
    ])

    const items = await fetchShoppingItems()

    expect(items).toEqual([
      {
        id: '1',
        name: '牛奶',
        quantity: 2,
        unit: '瓶',
        category: '乳製品',
        purchased: false,
        createdAt: '2026-09-01T00:00:00Z',
        updatedAt: '2026-09-01T00:00:00Z',
      },
    ])
  })

  it('insertShoppingItem resolves the current user and maps camelCase input to a snake_case row', async () => {
    getCurrentUserId.mockResolvedValue('user-1')
    repository.createItem.mockResolvedValue({
      id: '2',
      name: '雞蛋',
      quantity: 6,
      unit: '盒',
      category_code: '其他',
      purchased: false,
      created_at: '2026-09-02T00:00:00Z',
      updated_at: '2026-09-02T00:00:00Z',
    })

    const item = await insertShoppingItem({ name: '雞蛋', quantity: 6, unit: '盒', category: '其他' })

    expect(repository.createItem).toHaveBeenCalledWith({
      user_id: 'user-1',
      name: '雞蛋',
      quantity: 6,
      unit: '盒',
      category_code: '其他',
    })
    expect(item.unit).toBe('盒')
    expect(item.category).toBe('其他')
  })

  it('insertShoppingItem normalizes an empty unit to null', async () => {
    getCurrentUserId.mockResolvedValue('user-1')
    repository.createItem.mockResolvedValue({
      id: '2',
      name: '雞蛋',
      quantity: 6,
      unit: null,
      category_code: '其他',
      purchased: false,
      created_at: '2026-09-02T00:00:00Z',
      updated_at: '2026-09-02T00:00:00Z',
    })

    await insertShoppingItem({ name: '雞蛋', quantity: 6, unit: '', category: '其他' })

    expect(repository.createItem).toHaveBeenCalledWith(
      expect.objectContaining({ unit: null }),
    )
  })

  it('updateShoppingItem only sends the fields present in updates', async () => {
    repository.updateItem.mockResolvedValue({
      id: '3',
      name: '牛奶',
      quantity: 1,
      unit: '瓶',
      category_code: '乳製品',
      purchased: true,
      created_at: '2026-09-01T00:00:00Z',
      updated_at: '2026-09-03T00:00:00Z',
    })

    await updateShoppingItem('3', { purchased: true })

    expect(repository.updateItem).toHaveBeenCalledWith('3', { purchased: true })
  })

  it('updateShoppingItem maps name/quantity/unit/category updates together', async () => {
    repository.updateItem.mockResolvedValue({
      id: '3',
      name: '全脂牛奶',
      quantity: 2,
      unit: '瓶',
      category_code: '乳製品',
      purchased: false,
      created_at: '2026-09-01T00:00:00Z',
      updated_at: '2026-09-03T00:00:00Z',
    })

    await updateShoppingItem('3', {
      name: '全脂牛奶',
      quantity: 2,
      unit: '瓶',
      category: '乳製品',
    })

    expect(repository.updateItem).toHaveBeenCalledWith('3', {
      name: '全脂牛奶',
      quantity: 2,
      unit: '瓶',
      category_code: '乳製品',
    })
  })

  it('updateShoppingItem normalizes an empty unit to null', async () => {
    repository.updateItem.mockResolvedValue({
      id: '3',
      name: '牛奶',
      quantity: 1,
      unit: null,
      category_code: '乳製品',
      purchased: false,
      created_at: '2026-09-01T00:00:00Z',
      updated_at: '2026-09-03T00:00:00Z',
    })

    await updateShoppingItem('3', { unit: '' })

    expect(repository.updateItem).toHaveBeenCalledWith('3', { unit: null })
  })

  it('deleteShoppingItem delegates to the repository', async () => {
    repository.deleteItem.mockResolvedValue(undefined)

    await deleteShoppingItem('4')

    expect(repository.deleteItem).toHaveBeenCalledWith('4')
  })
})
