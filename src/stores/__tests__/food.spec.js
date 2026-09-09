import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useFoodStore } from '../food'
import * as foodService from '../../services/foodService'

vi.mock('../../services/foodService', () => ({
  fetchFoods: vi.fn(),
  fetchFoodById: vi.fn(),
  insertFood: vi.fn(),
  updateFood: vi.fn(),
  deleteFood: vi.fn(),
}))

describe('food store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('loadFoods fills foods from the service', async () => {
    const foods = [{ id: '1', name: '牛奶' }]
    foodService.fetchFoods.mockResolvedValue(foods)

    const store = useFoodStore()
    await store.loadFoods()

    expect(store.foods).toEqual(foods)
  })

  it('addFood appends the created food without refetching the whole list', async () => {
    foodService.insertFood.mockResolvedValue({ id: '2', name: '雞蛋' })

    const store = useFoodStore()
    await store.addFood({ name: '雞蛋' })

    expect(store.foods).toEqual([{ id: '2', name: '雞蛋' }])
    expect(foodService.fetchFoods).not.toHaveBeenCalled()
  })

  it('updateFood replaces the matching item in place', async () => {
    const store = useFoodStore()
    store.foods = [{ id: '1', name: '牛奶', quantity: 1 }]
    foodService.updateFood.mockResolvedValue({ id: '1', name: '牛奶', quantity: 3 })

    await store.updateFood('1', { quantity: 3 })

    expect(store.foods).toEqual([{ id: '1', name: '牛奶', quantity: 3 }])
  })

  it('deleteFood removes the matching item', async () => {
    const store = useFoodStore()
    store.foods = [{ id: '1', name: '牛奶' }]
    foodService.deleteFood.mockResolvedValue(undefined)

    await store.deleteFood('1')

    expect(store.foods).toEqual([])
  })

  it('propagates a rejected service call instead of swallowing it', async () => {
    foodService.fetchFoods.mockRejectedValue(new Error('network error'))

    const store = useFoodStore()

    await expect(store.loadFoods()).rejects.toThrow('network error')
  })
})
