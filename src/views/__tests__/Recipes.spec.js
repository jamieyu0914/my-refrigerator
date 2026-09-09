import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, shallowMount } from '@vue/test-utils'
import Recipes from '../Recipes.vue'
import RecipeList from '../../components/RecipeList.vue'
import RecipeSearchInput from '../../components/RecipeSearchInput.vue'
import { useRecipeStore } from '../../stores/recipe'

vi.mock('../../stores/recipe', () => ({
  useRecipeStore: vi.fn(),
}))

function mountWithStore(overrides = {}) {
  useRecipeStore.mockReturnValue({
    recipes: [],
    loadRecipes: vi.fn().mockResolvedValue(undefined),
    toggleFavorite: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  })

  return shallowMount(Recipes)
}

describe('Recipes.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows a loading message while recipes are being fetched', () => {
    const wrapper = mountWithStore({ loadRecipes: vi.fn(() => new Promise(() => {})) })

    expect(wrapper.text()).toContain('載入中')
  })

  it('shows an error message when loading fails, and stops loading', async () => {
    const wrapper = mountWithStore({ loadRecipes: vi.fn().mockRejectedValue(new Error('fail')) })

    await flushPromises()

    expect(wrapper.text()).toContain('載入食譜失敗')
    expect(wrapper.text()).not.toContain('載入中')
  })

  it('passes the loaded recipes through to RecipeList', async () => {
    const recipes = [{ id: '1', title: '番茄炒蛋', imageUrl: null, tags: [], isFavorite: false }]
    const wrapper = mountWithStore({ recipes })

    await flushPromises()

    expect(wrapper.findComponent(RecipeList).props('recipes')).toEqual(recipes)
  })

  it('filters recipes by search query matching the title or a tag', async () => {
    const recipes = [
      { id: '1', title: '番茄炒蛋', imageUrl: null, tags: ['快速'], isFavorite: false },
      { id: '2', title: '味噌湯', imageUrl: null, tags: ['湯品'], isFavorite: false },
    ]
    const wrapper = mountWithStore({ recipes })
    await flushPromises()

    await wrapper.findComponent(RecipeSearchInput).vm.$emit('update:modelValue', '番茄')
    expect(wrapper.findComponent(RecipeList).props('recipes')).toEqual([recipes[0]])

    await wrapper.findComponent(RecipeSearchInput).vm.$emit('update:modelValue', '湯品')
    expect(wrapper.findComponent(RecipeList).props('recipes')).toEqual([recipes[1]])
  })

  it('shows a search-specific empty message when no recipes match the query', async () => {
    const recipes = [{ id: '1', title: '番茄炒蛋', imageUrl: null, tags: [], isFavorite: false }]
    const wrapper = mountWithStore({ recipes })
    await flushPromises()

    await wrapper.findComponent(RecipeSearchInput).vm.$emit('update:modelValue', '不存在的食譜')

    expect(wrapper.findComponent(RecipeList).props('recipes')).toEqual([])
    expect(wrapper.findComponent(RecipeList).props('emptyMessage')).toContain('不存在的食譜')
  })

  it('prevents a second favorite toggle for the same recipe while one is in flight', async () => {
    let resolveToggle
    const toggleFavorite = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveToggle = resolve
        }),
    )
    const wrapper = mountWithStore({
      recipes: [{ id: '1', title: '番茄炒蛋', imageUrl: null, tags: [], isFavorite: false }],
      toggleFavorite,
    })
    await flushPromises()

    const recipeList = wrapper.findComponent(RecipeList)
    recipeList.vm.$emit('toggle-favorite', '1')
    await flushPromises()

    expect(toggleFavorite).toHaveBeenCalledTimes(1)
    expect(wrapper.findComponent(RecipeList).props('togglingIds')).toEqual(['1'])

    recipeList.vm.$emit('toggle-favorite', '1')
    await flushPromises()
    expect(toggleFavorite).toHaveBeenCalledTimes(1)

    resolveToggle()
    await flushPromises()

    expect(wrapper.findComponent(RecipeList).props('togglingIds')).toEqual([])
  })
})
