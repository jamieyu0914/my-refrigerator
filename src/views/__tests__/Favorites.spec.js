import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, shallowMount } from '@vue/test-utils'
import Favorites from '../Favorites.vue'
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

  return shallowMount(Favorites)
}

describe('Favorites.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('only passes recipes with isFavorite true through to RecipeList', async () => {
    const recipes = [
      { id: '1', title: '番茄炒蛋', imageUrl: null, tags: [], isFavorite: true },
      { id: '2', title: '味噌湯', imageUrl: null, tags: [], isFavorite: false },
    ]
    const wrapper = mountWithStore({ recipes })

    await flushPromises()

    expect(wrapper.findComponent(RecipeList).props('recipes')).toEqual([recipes[0]])
  })

  it('further filters favorites by search query', async () => {
    const recipes = [
      { id: '1', title: '番茄炒蛋', imageUrl: null, tags: [], isFavorite: true },
      { id: '2', title: '味噌湯', imageUrl: null, tags: [], isFavorite: true },
    ]
    const wrapper = mountWithStore({ recipes })
    await flushPromises()

    await wrapper.findComponent(RecipeSearchInput).vm.$emit('update:modelValue', '味噌')

    expect(wrapper.findComponent(RecipeList).props('recipes')).toEqual([recipes[1]])
  })

  it('shows a search-specific empty message when no favorites match the query', async () => {
    const recipes = [{ id: '1', title: '番茄炒蛋', imageUrl: null, tags: [], isFavorite: true }]
    const wrapper = mountWithStore({ recipes })
    await flushPromises()

    await wrapper.findComponent(RecipeSearchInput).vm.$emit('update:modelValue', '不存在')

    expect(wrapper.findComponent(RecipeList).props('recipes')).toEqual([])
    expect(wrapper.findComponent(RecipeList).props('emptyMessage')).toContain('不存在')
  })

  it('shows the favorites-specific empty message when there are no favorites', async () => {
    const wrapper = mountWithStore({
      recipes: [{ id: '1', title: '番茄炒蛋', imageUrl: null, tags: [], isFavorite: false }],
    })

    await flushPromises()

    expect(wrapper.findComponent(RecipeList).props('emptyMessage')).toContain('最愛食譜')
  })
})
