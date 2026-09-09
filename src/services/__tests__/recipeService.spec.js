import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchRecipeById, fetchRecipes, insertRecipe, updateRecipe } from '../recipeService'
import * as repository from '../../repositories/recipeRepository'
import { getCurrentUserId } from '../supabaseClient'

vi.mock('../supabaseClient', () => ({
  getCurrentUserId: vi.fn(),
}))

vi.mock('../../repositories/recipeRepository', () => ({
  getItems: vi.fn(),
  getItemById: vi.fn(),
  createItem: vi.fn(),
  createIngredients: vi.fn(),
  createSteps: vi.fn(),
  updateItem: vi.fn(),
}))

describe('recipeService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetchRecipes maps snake_case rows to camelCase Recipe objects without ingredients/steps', async () => {
    repository.getItems.mockResolvedValue([
      {
        id: '1',
        title: '番茄炒蛋',
        image_url: null,
        cook_time_minutes: 15,
        difficulty: '簡單',
        description: '家常快炒',
        tags: ['快速'],
        is_favorite: false,
        created_at: '2026-09-01T00:00:00Z',
        updated_at: '2026-09-01T00:00:00Z',
      },
    ])

    const recipes = await fetchRecipes()

    expect(recipes).toEqual([
      {
        id: '1',
        title: '番茄炒蛋',
        imageUrl: null,
        cookTimeMinutes: 15,
        difficulty: '簡單',
        description: '家常快炒',
        tags: ['快速'],
        isFavorite: false,
        createdAt: '2026-09-01T00:00:00Z',
        updatedAt: '2026-09-01T00:00:00Z',
      },
    ])
  })

  it('fetchRecipeById maps embedded recipe_ingredients/recipe_steps, sorted by sort_order', async () => {
    repository.getItemById.mockResolvedValue({
      id: '1',
      title: '番茄炒蛋',
      image_url: null,
      cook_time_minutes: 15,
      difficulty: '簡單',
      description: '家常快炒',
      tags: ['快速'],
      is_favorite: false,
      created_at: '2026-09-01T00:00:00Z',
      updated_at: '2026-09-01T00:00:00Z',
      recipe_ingredients: [
        { id: 'i2', name: '番茄', amount: '2 顆', sort_order: 1 },
        { id: 'i1', name: '雞蛋', amount: '3 顆', sort_order: 0 },
      ],
      recipe_steps: [
        { id: 's2', description: '加入番茄拌炒', sort_order: 1 },
        { id: 's1', description: '雞蛋打散', sort_order: 0 },
      ],
    })

    const recipe = await fetchRecipeById('1')

    expect(recipe.ingredients).toEqual([
      { id: 'i1', name: '雞蛋', amount: '3 顆', sortOrder: 0 },
      { id: 'i2', name: '番茄', amount: '2 顆', sortOrder: 1 },
    ])
    expect(recipe.steps).toEqual([
      { id: 's1', description: '雞蛋打散', sortOrder: 0 },
      { id: 's2', description: '加入番茄拌炒', sortOrder: 1 },
    ])
  })

  it('insertRecipe creates the recipe row, then its ingredients and steps, then refetches by id', async () => {
    getCurrentUserId.mockResolvedValue('user-1')
    repository.createItem.mockResolvedValue({ id: '2' })
    repository.createIngredients.mockResolvedValue([])
    repository.createSteps.mockResolvedValue([])
    repository.getItemById.mockResolvedValue({
      id: '2',
      title: '味噌湯',
      image_url: null,
      cook_time_minutes: null,
      difficulty: null,
      description: null,
      tags: [],
      is_favorite: false,
      created_at: '2026-09-02T00:00:00Z',
      updated_at: '2026-09-02T00:00:00Z',
      recipe_ingredients: [],
      recipe_steps: [],
    })

    const recipe = await insertRecipe({
      title: '味噌湯',
      imageUrl: '',
      cookTimeMinutes: null,
      difficulty: null,
      description: null,
      tags: [],
      ingredients: [{ name: '味噌', amount: '2 大匙' }],
      steps: [{ description: '煮滾' }],
    })

    expect(repository.createItem).toHaveBeenCalledWith({
      user_id: 'user-1',
      title: '味噌湯',
      image_url: null,
      cook_time_minutes: null,
      difficulty: null,
      description: null,
      tags: [],
    })
    expect(repository.createIngredients).toHaveBeenCalledWith([
      { recipe_id: '2', name: '味噌', amount: '2 大匙', sort_order: 0 },
    ])
    expect(repository.createSteps).toHaveBeenCalledWith([
      { recipe_id: '2', description: '煮滾', sort_order: 0 },
    ])
    expect(repository.getItemById).toHaveBeenCalledWith('2')
    expect(recipe.title).toBe('味噌湯')
  })

  it('updateRecipe only sends the fields present in updates', async () => {
    repository.updateItem.mockResolvedValue({
      id: '3',
      title: '味噌湯',
      image_url: null,
      cook_time_minutes: null,
      difficulty: null,
      description: null,
      tags: [],
      is_favorite: true,
      created_at: '2026-09-02T00:00:00Z',
      updated_at: '2026-09-02T00:00:00Z',
    })

    await updateRecipe('3', { isFavorite: true })

    expect(repository.updateItem).toHaveBeenCalledWith('3', { is_favorite: true })
  })
})
