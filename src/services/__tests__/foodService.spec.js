import { beforeEach, describe, expect, it, vi } from 'vitest'
import { deleteFood, fetchFoods, insertFood, updateFood } from '../foodService'
import * as repository from '../../repositories/refrigeratorRepository'
import { getCurrentUserId } from '../supabaseClient'

vi.mock('../supabaseClient', () => ({
  getCurrentUserId: vi.fn(),
}))

vi.mock('../../repositories/refrigeratorRepository', () => ({
  getItems: vi.fn(),
  getItemById: vi.fn(),
  createItem: vi.fn(),
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
}))

describe('foodService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetchFoods maps snake_case rows to camelCase Food objects', async () => {
    repository.getItems.mockResolvedValue([
      {
        id: '1',
        name: '牛奶',
        category_code: '乳製品',
        quantity: 2,
        expiry_date: '2026-09-20',
        added_at: '2026-09-01T00:00:00Z',
      },
    ])

    const foods = await fetchFoods()

    expect(foods).toEqual([
      {
        id: '1',
        name: '牛奶',
        category: '乳製品',
        quantity: 2,
        expiryDate: '2026-09-20',
        addedAt: '2026-09-01T00:00:00Z',
      },
    ])
  })

  it('insertFood resolves the current user and maps camelCase input to a snake_case row', async () => {
    getCurrentUserId.mockResolvedValue('user-1')
    repository.createItem.mockResolvedValue({
      id: '2',
      name: '雞蛋',
      category_code: '其他',
      quantity: 6,
      expiry_date: null,
      added_at: '2026-09-02T00:00:00Z',
    })

    const food = await insertFood({ name: '雞蛋', category: '其他', quantity: 6, expiryDate: '' })

    expect(repository.createItem).toHaveBeenCalledWith({
      user_id: 'user-1',
      name: '雞蛋',
      category_code: '其他',
      quantity: 6,
      expiry_date: null,
    })
    expect(food.category).toBe('其他')
  })

  it('updateFood only sends the fields present in updates', async () => {
    repository.updateItem.mockResolvedValue({
      id: '3',
      name: '牛奶',
      category_code: '乳製品',
      quantity: 1,
      expiry_date: '2026-09-15',
      added_at: '2026-09-01T00:00:00Z',
    })

    await updateFood('3', { quantity: 1 })

    expect(repository.updateItem).toHaveBeenCalledWith('3', { quantity: 1 })
  })

  it('deleteFood delegates to the repository', async () => {
    repository.deleteItem.mockResolvedValue(undefined)

    await deleteFood('4')

    expect(repository.deleteItem).toHaveBeenCalledWith('4')
  })
})
