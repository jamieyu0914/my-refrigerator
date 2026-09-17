import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAiVisionStore } from '../aiVision'
import { useFoodStore } from '../food'
import * as aiVisionService from '../../services/aiVisionService'

vi.mock('../../services/aiVisionService', () => ({
  recognizeFoods: vi.fn(),
}))

describe('aiVision store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('analyzeImage fills recognizedItems from the service', async () => {
    const items = [{ tempId: '1', name: '雞蛋', category: '其他', selected: true }]
    aiVisionService.recognizeFoods.mockResolvedValue(items)

    const store = useAiVisionStore()
    await store.analyzeImage(new File([], 'a.jpg'))

    expect(store.recognizedItems).toEqual(items)
  })

  it('propagates a rejected analysis instead of swallowing it', async () => {
    aiVisionService.recognizeFoods.mockRejectedValue(new Error('recognition failed'))

    const store = useAiVisionStore()

    await expect(store.analyzeImage(new File([], 'a.jpg'))).rejects.toThrow('recognition failed')
  })

  it('updateItem merges fields into the matching draft item', async () => {
    const store = useAiVisionStore()
    store.recognizedItems = [{ tempId: '1', name: '雞蛋', category: '其他', selected: true }]

    store.updateItem('1', { selected: false })

    expect(store.recognizedItems[0].selected).toBe(false)
  })

  it('removeItem drops the matching draft item', () => {
    const store = useAiVisionStore()
    store.recognizedItems = [
      { tempId: '1', name: '雞蛋', selected: true },
      { tempId: '2', name: '番茄', selected: true },
    ]

    store.removeItem('1')

    expect(store.recognizedItems).toEqual([{ tempId: '2', name: '番茄', selected: true }])
  })

  it('discard clears all draft items', () => {
    const store = useAiVisionStore()
    store.recognizedItems = [{ tempId: '1', name: '雞蛋', selected: true }]

    store.discard()

    expect(store.recognizedItems).toEqual([])
  })

  it('confirmSelected only writes selected items and never calls the AI service', async () => {
    const store = useAiVisionStore()
    store.recognizedItems = [
      { tempId: '1', name: '雞蛋', category: '其他', quantity: 1, selected: true },
      { tempId: '2', name: '番茄', category: '蔬果', quantity: 1, selected: false },
    ]
    const foodStore = useFoodStore()
    foodStore.addFood = vi.fn().mockResolvedValue({ id: 'x' })

    await store.confirmSelected()

    expect(foodStore.addFood).toHaveBeenCalledTimes(1)
    expect(foodStore.addFood).toHaveBeenCalledWith({
      name: '雞蛋',
      category: '其他',
      quantity: 1,
      expiryDate: null,
    })
    expect(aiVisionService.recognizeFoods).not.toHaveBeenCalled()
  })

  it('confirmSelected clears recognizedItems once every selected item is added', async () => {
    const store = useAiVisionStore()
    store.recognizedItems = [{ tempId: '1', name: '雞蛋', category: '其他', selected: true }]
    const foodStore = useFoodStore()
    foodStore.addFood = vi.fn().mockResolvedValue({ id: 'x' })

    await store.confirmSelected()

    expect(store.recognizedItems).toEqual([])
  })

  it('confirmSelected keeps only the items that failed to add, and throws', async () => {
    const store = useAiVisionStore()
    store.recognizedItems = [
      { tempId: '1', name: '雞蛋', category: '其他', selected: true },
      { tempId: '2', name: '番茄', category: '蔬果', selected: true },
    ]
    const foodStore = useFoodStore()
    foodStore.addFood = vi
      .fn()
      .mockResolvedValueOnce({ id: 'ok' })
      .mockRejectedValueOnce(new Error('insert failed'))

    await expect(store.confirmSelected()).rejects.toThrow('1 項加入失敗')

    expect(store.recognizedItems).toEqual([
      { tempId: '2', name: '番茄', category: '蔬果', selected: true },
    ])
  })
})
