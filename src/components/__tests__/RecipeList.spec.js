import { describe, expect, it } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import RecipeList from '../RecipeList.vue'
import RecipeCard from '../RecipeCard.vue'

const recipes = [
  { id: '1', title: '番茄炒蛋', tags: [], isFavorite: false },
  { id: '2', title: '滷肉飯', tags: [], isFavorite: true },
]

describe('RecipeList.vue', () => {
  it('shows the default empty message when there are no recipes', () => {
    const wrapper = shallowMount(RecipeList, { props: { recipes: [] } })

    expect(wrapper.text()).toContain('還沒有食譜')
    expect(wrapper.findAllComponents(RecipeCard)).toHaveLength(0)
  })

  it('shows a custom empty message when provided', () => {
    const wrapper = shallowMount(RecipeList, {
      props: { recipes: [], emptyMessage: '沒有收藏的食譜' },
    })

    expect(wrapper.text()).toContain('沒有收藏的食譜')
  })

  it('renders a RecipeCard per recipe', () => {
    const wrapper = shallowMount(RecipeList, { props: { recipes } })

    const cards = wrapper.findAllComponents(RecipeCard)
    expect(cards).toHaveLength(2)
    expect(cards[0].props('recipe')).toEqual(recipes[0])
    expect(cards[1].props('recipe')).toEqual(recipes[1])
  })

  it('marks a card as toggling when its id is in togglingIds', () => {
    const wrapper = shallowMount(RecipeList, { props: { recipes, togglingIds: ['2'] } })

    const cards = wrapper.findAllComponents(RecipeCard)
    expect(cards[0].props('toggling')).toBe(false)
    expect(cards[1].props('toggling')).toBe(true)
  })

  it('forwards a toggle-favorite event from a card', () => {
    const wrapper = shallowMount(RecipeList, { props: { recipes } })

    wrapper.findAllComponents(RecipeCard)[1].vm.$emit('toggle-favorite', '2')

    expect(wrapper.emitted('toggle-favorite')).toEqual([['2']])
  })
})
