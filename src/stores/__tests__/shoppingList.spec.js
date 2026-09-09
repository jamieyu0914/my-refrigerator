import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useShoppingListStore } from '../shoppingList'
import * as shoppingListService from '../../services/shoppingListService'

vi.mock('../../services/shoppingListService', () => ({
  fetchShoppingItems: vi.fn(),
  insertShoppingItem: vi.fn(),
  updateShoppingItem: vi.fn(),
  deleteShoppingItem: vi.fn(),
}))

describe('shoppingList store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('loadItems fills items from the service', async () => {
    const items = [{ id: '1', name: '牛奶', quantity: 1, unit: '瓶', category: '乳製品', purchased: false }]
    shoppingListService.fetchShoppingItems.mockResolvedValue(items)

    const store = useShoppingListStore()
    await store.loadItems()

    expect(store.items).toEqual(items)
  })

  it('addItem appends the created item without refetching the whole list', async () => {
    shoppingListService.insertShoppingItem.mockResolvedValue({
      id: '2',
      name: '雞蛋',
      quantity: 6,
      unit: '盒',
      category: '其他',
      purchased: false,
    })

    const store = useShoppingListStore()
    await store.addItem({ name: '雞蛋', quantity: 6, unit: '盒', category: '其他' })

    expect(store.items).toEqual([
      { id: '2', name: '雞蛋', quantity: 6, unit: '盒', category: '其他', purchased: false },
    ])
    expect(shoppingListService.fetchShoppingItems).not.toHaveBeenCalled()
  })

  it('togglePurchased flips the purchased field of the matching item in place', async () => {
    const store = useShoppingListStore()
    store.items = [
      { id: '1', name: '牛奶', quantity: 1, unit: '瓶', category: '乳製品', purchased: false },
    ]
    shoppingListService.updateShoppingItem.mockResolvedValue({
      id: '1',
      name: '牛奶',
      quantity: 1,
      unit: '瓶',
      category: '乳製品',
      purchased: true,
    })

    await store.togglePurchased('1')

    expect(shoppingListService.updateShoppingItem).toHaveBeenCalledWith('1', { purchased: true })
    expect(store.items[0].purchased).toBe(true)
  })

  it('updateItem merges the returned fields into the matching item in place', async () => {
    const store = useShoppingListStore()
    store.items = [
      { id: '1', name: '牛奶', quantity: 1, unit: '瓶', category: '乳製品', purchased: false },
    ]
    shoppingListService.updateShoppingItem.mockResolvedValue({
      id: '1',
      name: '全脂牛奶',
      quantity: 2,
      unit: '瓶',
      category: '乳製品',
      purchased: false,
    })

    await store.updateItem('1', { name: '全脂牛奶', quantity: 2 })

    expect(shoppingListService.updateShoppingItem).toHaveBeenCalledWith('1', {
      name: '全脂牛奶',
      quantity: 2,
    })
    expect(store.items[0]).toEqual({
      id: '1',
      name: '全脂牛奶',
      quantity: 2,
      unit: '瓶',
      category: '乳製品',
      purchased: false,
    })
  })

  it('togglePurchased and updateItem are no-ops for an unknown id', async () => {
    const store = useShoppingListStore()
    store.items = [
      { id: '1', name: '牛奶', quantity: 1, unit: '瓶', category: '乳製品', purchased: false },
    ]

    await store.togglePurchased('missing')
    await store.updateItem('missing', { name: 'x' })

    expect(shoppingListService.updateShoppingItem).not.toHaveBeenCalled()
    expect(store.items).toEqual([
      { id: '1', name: '牛奶', quantity: 1, unit: '瓶', category: '乳製品', purchased: false },
    ])
  })

  it('deleteItem is a no-op for an unknown id', async () => {
    const store = useShoppingListStore()
    store.items = [
      { id: '1', name: '牛奶', quantity: 1, unit: '瓶', category: '乳製品', purchased: false },
    ]
    shoppingListService.deleteShoppingItem.mockResolvedValue(undefined)

    await store.deleteItem('missing')

    expect(store.items).toEqual([
      { id: '1', name: '牛奶', quantity: 1, unit: '瓶', category: '乳製品', purchased: false },
    ])
  })

  it('deleteItem removes the matching item', async () => {
    const store = useShoppingListStore()
    store.items = [{ id: '1', name: '牛奶', quantity: 1, unit: '瓶', category: '乳製品', purchased: false }]
    shoppingListService.deleteShoppingItem.mockResolvedValue(undefined)

    await store.deleteItem('1')

    expect(store.items).toEqual([])
  })

  it('propagates a rejected service call instead of swallowing it', async () => {
    shoppingListService.fetchShoppingItems.mockRejectedValue(new Error('network error'))

    const store = useShoppingListStore()

    await expect(store.loadItems()).rejects.toThrow('network error')
  })
})
