import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useRecipeStore } from '../recipe'
import * as recipeService from '../../services/recipeService'

vi.mock('../../services/recipeService', () => ({
  fetchRecipes: vi.fn(),
  fetchRecipeById: vi.fn(),
  insertRecipe: vi.fn(),
  updateRecipe: vi.fn(),
  deleteRecipe: vi.fn(),
  toggleFavorite: vi.fn(),
}))

describe('recipe store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('loadRecipes fills recipes from the service', async () => {
    const recipes = [{ id: '1', title: '番茄炒蛋' }]
    recipeService.fetchRecipes.mockResolvedValue(recipes)

    const store = useRecipeStore()
    await store.loadRecipes()

    expect(store.recipes).toEqual(recipes)
  })

  it('addRecipe appends the created recipe without refetching the whole list', async () => {
    recipeService.insertRecipe.mockResolvedValue({ id: '2', title: '味噌湯' })

    const store = useRecipeStore()
    await store.addRecipe({ title: '味噌湯' })

    expect(store.recipes).toEqual([{ id: '2', title: '味噌湯' }])
    expect(recipeService.fetchRecipes).not.toHaveBeenCalled()
  })

  it('updateRecipe replaces the matching item in place and returns the updated recipe', async () => {
    const store = useRecipeStore()
    store.recipes = [{ id: '1', title: '番茄炒蛋', isOwn: true }]
    recipeService.updateRecipe.mockResolvedValue({ id: '1', title: '番茄炒蛋（更新）', isOwn: true })

    const updated = await store.updateRecipe('1', { title: '番茄炒蛋（更新）' })

    expect(recipeService.updateRecipe).toHaveBeenCalledWith('1', { title: '番茄炒蛋（更新）' })
    expect(store.recipes).toEqual([{ id: '1', title: '番茄炒蛋（更新）', isOwn: true }])
    expect(updated).toEqual({ id: '1', title: '番茄炒蛋（更新）', isOwn: true })
  })

  it('deleteRecipe removes the matching item', async () => {
    const store = useRecipeStore()
    store.recipes = [{ id: '1', title: '番茄炒蛋' }]
    recipeService.deleteRecipe.mockResolvedValue(undefined)

    await store.deleteRecipe('1')

    expect(recipeService.deleteRecipe).toHaveBeenCalledWith('1')
    expect(store.recipes).toEqual([])
  })

  it('toggleFavorite calls the service, replaces the matching item in place, and returns the updated recipe', async () => {
    const store = useRecipeStore()
    store.recipes = [{ id: '1', title: '番茄炒蛋', isFavorite: false }]
    recipeService.toggleFavorite.mockResolvedValue({
      id: '1',
      title: '番茄炒蛋',
      isFavorite: true,
    })

    const updated = await store.toggleFavorite('1', false)

    expect(recipeService.toggleFavorite).toHaveBeenCalledWith('1', false)
    expect(store.recipes).toEqual([{ id: '1', title: '番茄炒蛋', isFavorite: true }])
    expect(updated).toEqual({ id: '1', title: '番茄炒蛋', isFavorite: true })
  })

  it('propagates a rejected service call instead of swallowing it', async () => {
    recipeService.fetchRecipes.mockRejectedValue(new Error('network error'))

    const store = useRecipeStore()

    await expect(store.loadRecipes()).rejects.toThrow('network error')
  })
})
