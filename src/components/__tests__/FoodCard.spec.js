import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import FoodCard from '../FoodCard.vue'

const mockPush = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
}))

const food = { id: '1', name: '牛奶', category: '乳製品', quantity: 1, expiryDate: null }

describe('FoodCard.vue', () => {
  it('renders the food name, category and quantity', () => {
    const wrapper = mount(FoodCard, { props: { food } })

    expect(wrapper.text()).toContain('牛奶')
    expect(wrapper.text()).toContain('乳製品')
    expect(wrapper.text()).toContain('數量 1')
  })

  it('navigates to the food-edit route when the main area is clicked', async () => {
    mockPush.mockClear()
    const wrapper = mount(FoodCard, { props: { food } })

    await wrapper.find('.food-main').trigger('click')

    expect(mockPush).toHaveBeenCalledWith({ name: 'food-edit', params: { id: '1' } })
  })

  it('emits delete with the food id when the delete button is clicked', async () => {
    const wrapper = mount(FoodCard, { props: { food } })

    await wrapper.find('.food-delete').trigger('click')

    expect(wrapper.emitted('delete')).toEqual([['1']])
  })

  it('disables the delete button while deleting', () => {
    const wrapper = mount(FoodCard, { props: { food, deleting: true } })

    expect(wrapper.find('.food-delete').attributes('disabled')).toBeDefined()
  })
})
