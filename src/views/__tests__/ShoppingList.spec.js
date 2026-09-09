import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, shallowMount } from '@vue/test-utils'
import ShoppingList from '../ShoppingList.vue'
import ShoppingItemRow from '../../components/ShoppingItemRow.vue'
import { useShoppingListStore } from '../../stores/shoppingList'
import { useFoodStore } from '../../stores/food'

vi.mock('../../stores/shoppingList', () => ({
  useShoppingListStore: vi.fn(),
}))

vi.mock('../../stores/food', () => ({
  useFoodStore: vi.fn(),
}))

function mountWithStore(overrides = {}, foodStoreOverrides = {}) {
  useShoppingListStore.mockReturnValue({
    items: [],
    loadItems: vi.fn().mockResolvedValue(undefined),
    addItem: vi.fn().mockResolvedValue(undefined),
    togglePurchased: vi.fn().mockResolvedValue(undefined),
    updateItem: vi.fn().mockResolvedValue(undefined),
    deleteItem: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  })

  useFoodStore.mockReturnValue({
    addFood: vi.fn().mockResolvedValue(undefined),
    ...foodStoreOverrides,
  })

  return shallowMount(ShoppingList)
}

describe('ShoppingList.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows a loading message while items are being fetched', () => {
    const wrapper = mountWithStore({ loadItems: vi.fn(() => new Promise(() => {})) })

    expect(wrapper.text()).toContain('載入中')
  })

  it('shows an error message when loading fails, and stops loading', async () => {
    const wrapper = mountWithStore({ loadItems: vi.fn().mockRejectedValue(new Error('fail')) })

    await flushPromises()

    expect(wrapper.text()).toContain('載入採買清單失敗')
    expect(wrapper.text()).not.toContain('載入中')
  })

  it('shows the empty state message when there are no items', async () => {
    const wrapper = mountWithStore({ items: [] })

    await flushPromises()

    expect(wrapper.text()).toContain('採買清單是空的')
    expect(wrapper.findAllComponents(ShoppingItemRow)).toHaveLength(0)
  })

  it('renders one row per item and passes it through', async () => {
    const items = [
      { id: '1', name: '牛奶', quantity: 1, unit: '瓶', category: '乳製品', purchased: false },
      { id: '2', name: '雞蛋', quantity: 6, unit: '盒', category: '其他', purchased: true },
    ]
    const wrapper = mountWithStore({ items })

    await flushPromises()

    const rows = wrapper.findAllComponents(ShoppingItemRow)
    expect(rows).toHaveLength(2)
    expect(rows[0].props('item')).toEqual(items[0])
    expect(rows[1].props('item')).toEqual(items[1])
  })

  it('prevents a second delete request for the same item while one is in flight', async () => {
    vi.stubGlobal('confirm', vi.fn(() => true))
    let resolveDelete
    const deleteItem = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveDelete = resolve
        }),
    )
    const wrapper = mountWithStore({
      items: [{ id: '1', name: '牛奶', quantity: 1, unit: '瓶', category: '乳製品', purchased: false }],
      deleteItem,
    })
    await flushPromises()

    const row = wrapper.findComponent(ShoppingItemRow)
    row.vm.$emit('delete', '1')
    await flushPromises()

    expect(deleteItem).toHaveBeenCalledTimes(1)
    expect(wrapper.findComponent(ShoppingItemRow).props('deleting')).toBe(true)

    row.vm.$emit('delete', '1')
    await flushPromises()
    expect(deleteItem).toHaveBeenCalledTimes(1)

    resolveDelete()
    await flushPromises()

    expect(wrapper.findComponent(ShoppingItemRow).props('deleting')).toBe(false)
  })

  it('only keeps one row in editing mode, and clears it after a successful save', async () => {
    const updateItem = vi.fn().mockResolvedValue(undefined)
    const items = [
      { id: '1', name: '牛奶', quantity: 1, unit: '瓶', category: '乳製品', purchased: false },
      { id: '2', name: '雞蛋', quantity: 6, unit: '盒', category: '其他', purchased: false },
    ]
    const wrapper = mountWithStore({ items, updateItem })
    await flushPromises()

    wrapper.findAllComponents(ShoppingItemRow)[0].vm.$emit('edit-start', '1')
    await flushPromises()

    let rows = wrapper.findAllComponents(ShoppingItemRow)
    expect(rows[0].props('editing')).toBe(true)
    expect(rows[1].props('editing')).toBe(false)

    rows[0].vm.$emit('edit-save', { id: '1', updates: { name: '全脂牛奶', quantity: 2 } })
    await flushPromises()

    expect(updateItem).toHaveBeenCalledWith('1', { name: '全脂牛奶', quantity: 2 })
    rows = wrapper.findAllComponents(ShoppingItemRow)
    expect(rows[0].props('editing')).toBe(false)
  })

  it('adds the item to the fridge when it transitions from unpurchased to purchased', async () => {
    const addFood = vi.fn().mockResolvedValue(undefined)
    const togglePurchased = vi.fn().mockResolvedValue(undefined)
    const items = [
      { id: '1', name: '雞蛋', quantity: 1, unit: '盒', category: '其他', purchased: false },
    ]
    const wrapper = mountWithStore({ items, togglePurchased }, { addFood })
    await flushPromises()

    wrapper.findComponent(ShoppingItemRow).vm.$emit('toggle', '1')
    await flushPromises()

    expect(togglePurchased).toHaveBeenCalledWith('1')
    expect(addFood).toHaveBeenCalledWith({
      name: '雞蛋',
      category: '其他',
      quantity: 1,
      expiryDate: null,
    })
  })

  it('does not touch the fridge when an already-purchased item is unchecked', async () => {
    const addFood = vi.fn().mockResolvedValue(undefined)
    const togglePurchased = vi.fn().mockResolvedValue(undefined)
    const items = [
      { id: '1', name: '雞蛋', quantity: 1, unit: '盒', category: '其他', purchased: true },
    ]
    const wrapper = mountWithStore({ items, togglePurchased }, { addFood })
    await flushPromises()

    wrapper.findComponent(ShoppingItemRow).vm.$emit('toggle', '1')
    await flushPromises()

    expect(togglePurchased).toHaveBeenCalledWith('1')
    expect(addFood).not.toHaveBeenCalled()
  })

  it('shows an error message when toggling purchased fails', async () => {
    const togglePurchased = vi.fn().mockRejectedValue(new Error('fail'))
    const items = [
      { id: '1', name: '雞蛋', quantity: 1, unit: '盒', category: '其他', purchased: false },
    ]
    const wrapper = mountWithStore({ items, togglePurchased })
    await flushPromises()

    wrapper.findComponent(ShoppingItemRow).vm.$emit('toggle', '1')
    await flushPromises()

    expect(wrapper.text()).toContain('更新狀態失敗')
  })

  it('defaults quantity to 1 when the quantity field is not a valid number', async () => {
    const addItem = vi.fn().mockResolvedValue(undefined)
    const wrapper = mountWithStore({ addItem })
    await flushPromises()

    await wrapper.find('input[type="text"]').setValue('麵包')
    await wrapper.find('input[type="number"]').setValue('')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(addItem).toHaveBeenCalledWith(expect.objectContaining({ quantity: 1 }))
  })

  it('ignores a second toggle for the same item while one is in flight', async () => {
    let resolveToggle
    const togglePurchased = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveToggle = resolve
        }),
    )
    const items = [
      { id: '1', name: '牛奶', quantity: 1, unit: '瓶', category: '乳製品', purchased: false },
    ]
    const wrapper = mountWithStore({ items, togglePurchased })
    await flushPromises()

    const row = wrapper.findComponent(ShoppingItemRow)
    row.vm.$emit('toggle', '1')
    row.vm.$emit('toggle', '1')
    await flushPromises()

    expect(togglePurchased).toHaveBeenCalledTimes(1)

    resolveToggle()
    await flushPromises()
  })

  it('ignores a toggle for an unknown item id', async () => {
    const togglePurchased = vi.fn().mockResolvedValue(undefined)
    const items = [
      { id: '1', name: '牛奶', quantity: 1, unit: '瓶', category: '乳製品', purchased: false },
    ]
    const wrapper = mountWithStore({ items, togglePurchased })
    await flushPromises()

    wrapper.findComponent(ShoppingItemRow).vm.$emit('toggle', 'missing')
    await flushPromises()

    expect(togglePurchased).not.toHaveBeenCalled()
  })

  it('ignores a second edit-save while one is in flight', async () => {
    let resolveUpdate
    const updateItem = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveUpdate = resolve
        }),
    )
    const items = [
      { id: '1', name: '牛奶', quantity: 1, unit: '瓶', category: '乳製品', purchased: false },
    ]
    const wrapper = mountWithStore({ items, updateItem })
    await flushPromises()

    const row = wrapper.findComponent(ShoppingItemRow)
    row.vm.$emit('edit-save', { id: '1', updates: { name: 'a' } })
    row.vm.$emit('edit-save', { id: '1', updates: { name: 'b' } })
    await flushPromises()

    expect(updateItem).toHaveBeenCalledTimes(1)

    resolveUpdate()
    await flushPromises()
  })

  it('adds a new item on submit, then resets the form', async () => {
    const addItem = vi.fn().mockResolvedValue(undefined)
    const wrapper = mountWithStore({ addItem })
    await flushPromises()

    await wrapper.find('input[type="text"]').setValue('麵包')
    await wrapper.find('input[type="number"]').setValue(2)
    await wrapper.find('.unit-input').setValue('條')
    await wrapper.find('.category-select').setValue('肉類')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(addItem).toHaveBeenCalledWith({
      name: '麵包',
      quantity: 2,
      unit: '條',
      category: '肉類',
    })
    expect(wrapper.find('input[type="text"]').element.value).toBe('')
  })

  it('does not add an item when the name is blank', async () => {
    const addItem = vi.fn().mockResolvedValue(undefined)
    const wrapper = mountWithStore({ addItem })
    await flushPromises()

    await wrapper.find('input[type="text"]').setValue('   ')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(addItem).not.toHaveBeenCalled()
  })

  it('shows an error message when adding an item fails', async () => {
    const addItem = vi.fn().mockRejectedValue(new Error('fail'))
    const wrapper = mountWithStore({ addItem })
    await flushPromises()

    await wrapper.find('input[type="text"]').setValue('麵包')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('新增失敗')
  })

  it('cancels editing without saving', async () => {
    const items = [
      { id: '1', name: '牛奶', quantity: 1, unit: '瓶', category: '乳製品', purchased: false },
    ]
    const wrapper = mountWithStore({ items })
    await flushPromises()

    const row = wrapper.findComponent(ShoppingItemRow)
    row.vm.$emit('edit-start', '1')
    await flushPromises()
    expect(wrapper.findComponent(ShoppingItemRow).props('editing')).toBe(true)

    wrapper.findComponent(ShoppingItemRow).vm.$emit('edit-cancel')
    await flushPromises()

    expect(wrapper.findComponent(ShoppingItemRow).props('editing')).toBe(false)
  })

  it('shows an error message when saving an edit fails', async () => {
    const updateItem = vi.fn().mockRejectedValue(new Error('fail'))
    const items = [
      { id: '1', name: '牛奶', quantity: 1, unit: '瓶', category: '乳製品', purchased: false },
    ]
    const wrapper = mountWithStore({ items, updateItem })
    await flushPromises()

    wrapper
      .findComponent(ShoppingItemRow)
      .vm.$emit('edit-save', { id: '1', updates: { name: '全脂牛奶' } })
    await flushPromises()

    expect(wrapper.text()).toContain('修改失敗')
  })

  it('does not delete when the confirmation is dismissed', async () => {
    vi.stubGlobal('confirm', vi.fn(() => false))
    const deleteItem = vi.fn().mockResolvedValue(undefined)
    const items = [
      { id: '1', name: '牛奶', quantity: 1, unit: '瓶', category: '乳製品', purchased: false },
    ]
    const wrapper = mountWithStore({ items, deleteItem })
    await flushPromises()

    wrapper.findComponent(ShoppingItemRow).vm.$emit('delete', '1')
    await flushPromises()

    expect(deleteItem).not.toHaveBeenCalled()
  })

  it('shows an error message when deleting fails', async () => {
    vi.stubGlobal('confirm', vi.fn(() => true))
    const deleteItem = vi.fn().mockRejectedValue(new Error('fail'))
    const items = [
      { id: '1', name: '牛奶', quantity: 1, unit: '瓶', category: '乳製品', purchased: false },
    ]
    const wrapper = mountWithStore({ items, deleteItem })
    await flushPromises()

    wrapper.findComponent(ShoppingItemRow).vm.$emit('delete', '1')
    await flushPromises()

    expect(wrapper.text()).toContain('刪除失敗')
  })
})
