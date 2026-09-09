import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import RecipeCard from '../RecipeCard.vue'

const mockPush = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
}))

const baseRecipe = {
  id: '1',
  title: '番茄炒蛋',
  imageUrl: null,
  cookTimeMinutes: null,
  difficulty: null,
  tags: [],
  isFavorite: false,
}

describe('RecipeCard.vue', () => {
  it('renders the recipe title and a fallback thumbnail when there is no image', () => {
    const wrapper = mount(RecipeCard, { props: { recipe: baseRecipe } })

    expect(wrapper.text()).toContain('番茄炒蛋')
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('.recipe-thumb-fallback').exists()).toBe(true)
  })

  it('renders an image when imageUrl is set', () => {
    const wrapper = mount(RecipeCard, {
      props: { recipe: { ...baseRecipe, imageUrl: 'https://example.com/a.jpg' } },
    })

    expect(wrapper.find('img').attributes('src')).toBe('https://example.com/a.jpg')
  })

  it('renders cook time and difficulty combined with a separator', () => {
    const wrapper = mount(RecipeCard, {
      props: { recipe: { ...baseRecipe, cookTimeMinutes: 20, difficulty: '簡單' } },
    })

    expect(wrapper.find('.recipe-meta').text()).toBe('⏱ 20 分鐘 · 難度：簡單')
  })

  it('renders tags', () => {
    const wrapper = mount(RecipeCard, {
      props: { recipe: { ...baseRecipe, tags: ['快速', '素食'] } },
    })

    const tags = wrapper.findAll('.tag')
    expect(tags.map((t) => t.text())).toEqual(['快速', '素食'])
  })

  it('navigates to the recipe-detail route when the main area is clicked', async () => {
    mockPush.mockClear()
    const wrapper = mount(RecipeCard, { props: { recipe: baseRecipe } })

    await wrapper.find('.recipe-main').trigger('click')

    expect(mockPush).toHaveBeenCalledWith({ name: 'recipe-detail', params: { id: '1' } })
  })

  it('shows an empty heart and emits toggle-favorite without navigating', async () => {
    mockPush.mockClear()
    const wrapper = mount(RecipeCard, { props: { recipe: baseRecipe } })

    const favoriteButton = wrapper.find('.recipe-favorite')
    expect(favoriteButton.text()).toBe('♡')

    await favoriteButton.trigger('click')

    expect(wrapper.emitted('toggle-favorite')).toEqual([['1']])
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('shows a filled heart when the recipe is a favorite, and disables the button while toggling', () => {
    const wrapper = mount(RecipeCard, {
      props: { recipe: { ...baseRecipe, isFavorite: true }, toggling: true },
    })

    expect(wrapper.find('.recipe-favorite').text()).toBe('❤️')
    expect(wrapper.find('.recipe-favorite').attributes('disabled')).toBeDefined()
  })
})
