import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, shallowMount } from '@vue/test-utils'
import Refrigerator from '../Refrigerator.vue'
import FoodList from '../../components/FoodList.vue'
import CategoryFilter from '../../components/CategoryFilter.vue'
import { useFoodStore } from '../../stores/food'

vi.mock('../../stores/food', () => ({
  useFoodStore: vi.fn(),
}))

function mountWithStore(overrides = {}) {
  useFoodStore.mockReturnValue({
    foods: [],
    loadFoods: vi.fn().mockResolvedValue(undefined),
    deleteFood: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  })

  return shallowMount(Refrigerator)
}

describe('Refrigerator.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows a loading message while foods are being fetched', () => {
    const wrapper = mountWithStore({ loadFoods: vi.fn(() => new Promise(() => {})) })

    expect(wrapper.text()).toContain('載入中')
  })

  it('shows an error message when loading fails, and stops loading', async () => {
    const wrapper = mountWithStore({ loadFoods: vi.fn().mockRejectedValue(new Error('fail')) })

    await flushPromises()

    expect(wrapper.text()).toContain('載入冰箱資料失敗')
    expect(wrapper.text()).not.toContain('載入中')
  })

  it('passes an empty food list through to FoodList once loading resolves', async () => {
    const wrapper = mountWithStore({ foods: [] })

    await flushPromises()

    expect(wrapper.text()).not.toContain('載入中')
    expect(wrapper.findComponent(FoodList).props('foods')).toEqual([])
  })

  it('passes the loaded foods through to FoodList', async () => {
    const foods = [
      { id: '1', name: '牛奶', category: '乳製品', quantity: 1, expiryDate: null },
    ]
    const wrapper = mountWithStore({ foods })

    await flushPromises()

    expect(wrapper.findComponent(FoodList).props('foods')).toEqual(foods)
  })

  it('prevents a second delete request for the same item while one is in flight', async () => {
    vi.stubGlobal('confirm', vi.fn(() => true))
    let resolveDelete
    const deleteFood = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveDelete = resolve
        }),
    )
    const wrapper = mountWithStore({
      foods: [{ id: '1', name: '牛奶', category: '乳製品', quantity: 1, expiryDate: null }],
      deleteFood,
    })
    await flushPromises()

    const foodList = wrapper.findComponent(FoodList)
    foodList.vm.$emit('delete', '1')
    await flushPromises()

    expect(deleteFood).toHaveBeenCalledTimes(1)
    expect(wrapper.findComponent(FoodList).props('deletingIds')).toEqual(['1'])

    foodList.vm.$emit('delete', '1')
    await flushPromises()
    expect(deleteFood).toHaveBeenCalledTimes(1)

    resolveDelete()
    await flushPromises()

    expect(wrapper.findComponent(FoodList).props('deletingIds')).toEqual([])
  })

  it('filters the visible foods by the selected category', async () => {
    const foods = [
      { id: '1', name: '牛奶', category: '乳製品', quantity: 1, expiryDate: null },
      { id: '2', name: '蘋果', category: '蔬果', quantity: 3, expiryDate: null },
    ]
    const wrapper = mountWithStore({ foods })
    await flushPromises()

    await wrapper.findComponent(CategoryFilter).vm.$emit('update:modelValue', '蔬果')

    expect(wrapper.findComponent(FoodList).props('foods')).toEqual([foods[1]])
  })

  it('shows an error message when deleting fails', async () => {
    vi.stubGlobal('confirm', vi.fn(() => true))
    const deleteFood = vi.fn().mockRejectedValue(new Error('fail'))
    const wrapper = mountWithStore({
      foods: [{ id: '1', name: '牛奶', category: '乳製品', quantity: 1, expiryDate: null }],
      deleteFood,
    })
    await flushPromises()

    wrapper.findComponent(FoodList).vm.$emit('delete', '1')
    await flushPromises()

    expect(wrapper.text()).toContain('刪除失敗')
  })

  it('does not delete when the confirmation is dismissed', async () => {
    vi.stubGlobal('confirm', vi.fn(() => false))
    const deleteFood = vi.fn().mockResolvedValue(undefined)
    const wrapper = mountWithStore({
      foods: [{ id: '1', name: '牛奶', category: '乳製品', quantity: 1, expiryDate: null }],
      deleteFood,
    })
    await flushPromises()

    wrapper.findComponent(FoodList).vm.$emit('delete', '1')
    await flushPromises()

    expect(deleteFood).not.toHaveBeenCalled()
  })
})
