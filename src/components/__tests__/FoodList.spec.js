import { describe, expect, it } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import FoodList from '../FoodList.vue'
import FoodCard from '../FoodCard.vue'

const foods = [
  { id: '1', name: '牛奶', category: '乳製品', quantity: 1, expiryDate: null },
  { id: '2', name: '蘋果', category: '蔬果', quantity: 3, expiryDate: null },
]

describe('FoodList.vue', () => {
  it('shows an empty message when there are no foods', () => {
    const wrapper = shallowMount(FoodList, { props: { foods: [] } })

    expect(wrapper.text()).toContain('冰箱空空的')
    expect(wrapper.findAllComponents(FoodCard)).toHaveLength(0)
  })

  it('renders a FoodCard per food', () => {
    const wrapper = shallowMount(FoodList, { props: { foods } })

    const cards = wrapper.findAllComponents(FoodCard)
    expect(cards).toHaveLength(2)
    expect(cards[0].props('food')).toEqual(foods[0])
    expect(cards[1].props('food')).toEqual(foods[1])
  })

  it('marks a card as deleting when its id is in deletingIds', () => {
    const wrapper = shallowMount(FoodList, { props: { foods, deletingIds: ['2'] } })

    const cards = wrapper.findAllComponents(FoodCard)
    expect(cards[0].props('deleting')).toBe(false)
    expect(cards[1].props('deleting')).toBe(true)
  })

  it('forwards a delete event from a card', async () => {
    const wrapper = shallowMount(FoodList, { props: { foods } })

    wrapper.findAllComponents(FoodCard)[0].vm.$emit('delete', '1')

    expect(wrapper.emitted('delete')).toEqual([['1']])
  })
})
