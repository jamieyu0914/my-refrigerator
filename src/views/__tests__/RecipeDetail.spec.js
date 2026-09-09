import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, shallowMount } from '@vue/test-utils'
import RecipeDetail from '../RecipeDetail.vue'
import { useRecipeStore } from '../../stores/recipe'

const mockPush = vi.fn()

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: '1' } }),
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('../../stores/recipe', () => ({
  useRecipeStore: vi.fn(),
}))

function mountWithStore(overrides = {}) {
  useRecipeStore.mockReturnValue({
    fetchRecipe: vi.fn().mockResolvedValue(undefined),
    toggleFavorite: vi.fn().mockResolvedValue(undefined),
    deleteRecipe: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  })

  return shallowMount(RecipeDetail)
}

const baseRecipe = {
  id: '1',
  title: '番茄炒蛋',
  imageUrl: null,
  cookTimeMinutes: 15,
  difficulty: '簡單',
  description: '快炒好上手的家常經典',
  tags: ['快速'],
  isFavorite: false,
  isOwn: false,
  ingredients: [{ id: 'i1', name: '番茄', amount: '2 顆' }],
  steps: [{ id: 's1', description: '番茄切塊' }],
}

describe('RecipeDetail.vue', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows a loading message while the recipe is being fetched', () => {
    const wrapper = mountWithStore({ fetchRecipe: vi.fn(() => new Promise(() => {})) })

    expect(wrapper.text()).toContain('載入中')
  })

  it('shows an error message when loading fails, and stops loading', async () => {
    const wrapper = mountWithStore({ fetchRecipe: vi.fn().mockRejectedValue(new Error('fail')) })

    await flushPromises()

    expect(wrapper.text()).toContain('載入食譜詳細內容失敗')
    expect(wrapper.text()).not.toContain('載入中')
  })

  it('renders the recipe title, ingredients, and steps once loaded', async () => {
    const wrapper = mountWithStore({ fetchRecipe: vi.fn().mockResolvedValue(baseRecipe) })

    await flushPromises()

    expect(wrapper.text()).toContain('番茄炒蛋')
    expect(wrapper.text()).toContain('番茄 2 顆')
    expect(wrapper.text()).toContain('番茄切塊')
  })

  it('hides edit/delete actions when the recipe is not owned by the current user', async () => {
    const wrapper = mountWithStore({
      fetchRecipe: vi.fn().mockResolvedValue({ ...baseRecipe, isOwn: false }),
    })

    await flushPromises()

    expect(wrapper.find('.owner-actions').exists()).toBe(false)
  })

  it('shows edit/delete actions when the recipe is owned by the current user', async () => {
    const wrapper = mountWithStore({
      fetchRecipe: vi.fn().mockResolvedValue({ ...baseRecipe, isOwn: true }),
    })

    await flushPromises()

    expect(wrapper.find('.owner-actions').exists()).toBe(true)
  })

  it('prevents a second favorite toggle while one is in flight', async () => {
    let resolveToggle
    const toggleFavorite = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveToggle = resolve
        }),
    )
    const wrapper = mountWithStore({
      fetchRecipe: vi.fn().mockResolvedValue(baseRecipe),
      toggleFavorite,
    })
    await flushPromises()

    const favoriteButton = wrapper.find('.favorite')
    favoriteButton.trigger('click')
    await favoriteButton.trigger('click')

    expect(toggleFavorite).toHaveBeenCalledTimes(1)
    expect(toggleFavorite).toHaveBeenCalledWith('1', false)

    resolveToggle({ ...baseRecipe, isFavorite: true })
    await flushPromises()

    expect(wrapper.text()).toContain('已加入最愛')
  })

  it('shows an error message when toggling a favorite fails', async () => {
    const toggleFavorite = vi.fn().mockRejectedValue(new Error('fail'))
    const wrapper = mountWithStore({
      fetchRecipe: vi.fn().mockResolvedValue(baseRecipe),
      toggleFavorite,
    })
    await flushPromises()

    await wrapper.find('.favorite').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('更新最愛狀態失敗')
  })

  it('renders a cover image when the recipe has an imageUrl', async () => {
    const wrapper = mountWithStore({
      fetchRecipe: vi.fn().mockResolvedValue({ ...baseRecipe, imageUrl: 'https://example.com/a.jpg' }),
    })
    await flushPromises()

    expect(wrapper.find('.cover').attributes('src')).toBe('https://example.com/a.jpg')
  })

  it('shows only the difficulty when cookTimeMinutes is absent', async () => {
    const wrapper = mountWithStore({
      fetchRecipe: vi.fn().mockResolvedValue({ ...baseRecipe, cookTimeMinutes: null, difficulty: '簡單' }),
    })
    await flushPromises()

    expect(wrapper.find('.meta').text()).toBe('難度：簡單')
  })

  it('renders an ingredient without its amount when the amount is missing', async () => {
    const wrapper = mountWithStore({
      fetchRecipe: vi.fn().mockResolvedValue({
        ...baseRecipe,
        ingredients: [{ id: 'i1', name: '番茄', amount: '' }],
      }),
    })
    await flushPromises()

    expect(wrapper.find('.ingredients').text()).toBe('番茄')
  })

  it('prevents a second delete request while one is in flight', async () => {
    vi.stubGlobal('confirm', vi.fn(() => true))
    let resolveDelete
    const deleteRecipe = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveDelete = resolve
        }),
    )
    const wrapper = mountWithStore({
      fetchRecipe: vi.fn().mockResolvedValue({ ...baseRecipe, isOwn: true }),
      deleteRecipe,
    })
    await flushPromises()

    const deleteButton = wrapper.find('.delete')
    deleteButton.trigger('click')
    await deleteButton.trigger('click')

    expect(deleteRecipe).toHaveBeenCalledTimes(1)

    resolveDelete()
    await flushPromises()
  })

  it('deletes the recipe and navigates back to the list when confirmed', async () => {
    vi.stubGlobal('confirm', vi.fn(() => true))
    const deleteRecipe = vi.fn().mockResolvedValue(undefined)
    const wrapper = mountWithStore({
      fetchRecipe: vi.fn().mockResolvedValue({ ...baseRecipe, isOwn: true }),
      deleteRecipe,
    })
    await flushPromises()

    await wrapper.find('.delete').trigger('click')
    await flushPromises()

    expect(deleteRecipe).toHaveBeenCalledWith('1')
    expect(mockPush).toHaveBeenCalledWith({ name: 'recipes' })
  })

  it('does not delete the recipe when the confirmation is dismissed', async () => {
    vi.stubGlobal('confirm', vi.fn(() => false))
    const deleteRecipe = vi.fn().mockResolvedValue(undefined)
    const wrapper = mountWithStore({
      fetchRecipe: vi.fn().mockResolvedValue({ ...baseRecipe, isOwn: true }),
      deleteRecipe,
    })
    await flushPromises()

    await wrapper.find('.delete').trigger('click')
    await flushPromises()

    expect(deleteRecipe).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('shows an error message when deletion fails', async () => {
    vi.stubGlobal('confirm', vi.fn(() => true))
    const deleteRecipe = vi.fn().mockRejectedValue(new Error('fail'))
    const wrapper = mountWithStore({
      fetchRecipe: vi.fn().mockResolvedValue({ ...baseRecipe, isOwn: true }),
      deleteRecipe,
    })
    await flushPromises()

    await wrapper.find('.delete').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('刪除失敗')
  })
})
