import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  deleteRecipe,
  fetchRecipeById,
  fetchRecipes,
  insertRecipe,
  toggleFavorite,
  updateRecipe,
} from '../recipeService'
import * as repository from '../../repositories/recipeRepository'
import * as favoriteRepository from '../../repositories/favoriteRecipeRepository'
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
  deleteItem: vi.fn(),
  deleteIngredients: vi.fn(),
  deleteSteps: vi.fn(),
}))

vi.mock('../../repositories/favoriteRecipeRepository', () => ({
  createFavorite: vi.fn(),
  deleteFavorite: vi.fn(),
}))

describe('recipeService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetchRecipes resolves the current user, passes it to the repository, and maps rows without ingredients/steps', async () => {
    getCurrentUserId.mockResolvedValue('user-1')
    repository.getItems.mockResolvedValue([
      {
        id: '1',
        user_id: 'user-1',
        title: '番茄炒蛋',
        image_url: null,
        cook_time_minutes: 15,
        difficulty: '簡單',
        description: '家常快炒',
        tags: ['快速'],
        favorite_recipes: [],
        created_at: '2026-09-01T00:00:00Z',
        updated_at: '2026-09-01T00:00:00Z',
      },
    ])

    const recipes = await fetchRecipes()

    expect(repository.getItems).toHaveBeenCalledWith('user-1')
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
        isOwn: true,
        createdAt: '2026-09-01T00:00:00Z',
        updatedAt: '2026-09-01T00:00:00Z',
      },
    ])
  })

  it('derives isFavorite from a non-empty embedded favorite_recipes array', async () => {
    getCurrentUserId.mockResolvedValue('user-1')
    repository.getItems.mockResolvedValue([
      {
        id: '1',
        user_id: 'user-2',
        title: '番茄炒蛋',
        image_url: null,
        cook_time_minutes: null,
        difficulty: null,
        description: null,
        tags: [],
        favorite_recipes: [{ user_id: 'user-1' }],
        created_at: '2026-09-01T00:00:00Z',
        updated_at: '2026-09-01T00:00:00Z',
      },
    ])

    const [recipe] = await fetchRecipes()

    expect(recipe.isFavorite).toBe(true)
    expect(recipe.isOwn).toBe(false)
  })

  it('treats a missing favorite_recipes field as not favorited', async () => {
    getCurrentUserId.mockResolvedValue('user-1')
    repository.getItems.mockResolvedValue([
      {
        id: '1',
        user_id: 'user-1',
        title: '番茄炒蛋',
        image_url: null,
        cook_time_minutes: null,
        difficulty: null,
        description: null,
        tags: [],
        created_at: '2026-09-01T00:00:00Z',
        updated_at: '2026-09-01T00:00:00Z',
      },
    ])

    const [recipe] = await fetchRecipes()

    expect(recipe.isFavorite).toBe(false)
  })

  it('fetchRecipeById resolves the current user, maps embedded recipe_ingredients/recipe_steps sorted by sort_order', async () => {
    getCurrentUserId.mockResolvedValue('user-1')
    repository.getItemById.mockResolvedValue({
      id: '1',
      user_id: 'user-1',
      title: '番茄炒蛋',
      image_url: null,
      cook_time_minutes: 15,
      difficulty: '簡單',
      description: '家常快炒',
      tags: ['快速'],
      favorite_recipes: [],
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

    expect(repository.getItemById).toHaveBeenCalledWith('1', 'user-1')
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
      user_id: 'user-1',
      title: '味噌湯',
      image_url: null,
      cook_time_minutes: null,
      difficulty: null,
      description: null,
      tags: [],
      favorite_recipes: [],
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
      ingredients: [{ name: '味噌', amount: '' }],
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
      { recipe_id: '2', name: '味噌', amount: null, sort_order: 0 },
    ])
    expect(repository.createSteps).toHaveBeenCalledWith([
      { recipe_id: '2', description: '煮滾', sort_order: 0 },
    ])
    expect(repository.getItemById).toHaveBeenCalledWith('2', 'user-1')
    expect(recipe.title).toBe('味噌湯')
  })

  it('updateRecipe updates recipe fields and replaces ingredients/steps, then refetches by id', async () => {
    getCurrentUserId.mockResolvedValue('user-1')
    repository.updateItem.mockResolvedValue({ id: '3' })
    repository.deleteIngredients.mockResolvedValue(undefined)
    repository.deleteSteps.mockResolvedValue(undefined)
    repository.createIngredients.mockResolvedValue([])
    repository.createSteps.mockResolvedValue([])
    repository.getItemById.mockResolvedValue({
      id: '3',
      user_id: 'user-1',
      title: '味噌湯（更新）',
      image_url: null,
      cook_time_minutes: null,
      difficulty: null,
      description: null,
      tags: [],
      favorite_recipes: [],
      created_at: '2026-09-02T00:00:00Z',
      updated_at: '2026-09-03T00:00:00Z',
      recipe_ingredients: [],
      recipe_steps: [],
    })

    const recipe = await updateRecipe('3', {
      title: '味噌湯（更新）',
      ingredients: [{ name: '味噌', amount: '3 大匙' }],
      steps: [{ description: '煮滾' }, { description: '關火' }],
    })

    expect(repository.updateItem).toHaveBeenCalledWith('3', { title: '味噌湯（更新）' })
    expect(repository.deleteIngredients).toHaveBeenCalledWith('3')
    expect(repository.createIngredients).toHaveBeenCalledWith([
      { recipe_id: '3', name: '味噌', amount: '3 大匙', sort_order: 0 },
    ])
    expect(repository.deleteSteps).toHaveBeenCalledWith('3')
    expect(repository.createSteps).toHaveBeenCalledWith([
      { recipe_id: '3', description: '煮滾', sort_order: 0 },
      { recipe_id: '3', description: '關火', sort_order: 1 },
    ])
    expect(repository.getItemById).toHaveBeenCalledWith('3', 'user-1')
    expect(recipe.title).toBe('味噌湯（更新）')
  })

  it('updateRecipe normalizes an empty imageUrl to null', async () => {
    getCurrentUserId.mockResolvedValue('user-1')
    repository.updateItem.mockResolvedValue({ id: '3' })
    repository.getItemById.mockResolvedValue({
      id: '3',
      user_id: 'user-1',
      title: '味噌湯',
      image_url: null,
      cook_time_minutes: null,
      difficulty: null,
      description: null,
      tags: [],
      favorite_recipes: [],
      created_at: '2026-09-02T00:00:00Z',
      updated_at: '2026-09-02T00:00:00Z',
    })

    await updateRecipe('3', { imageUrl: '' })

    expect(repository.updateItem).toHaveBeenCalledWith('3', { image_url: null })
  })

  it('updateRecipe maps imageUrl/cookTimeMinutes/difficulty/description/tags updates together', async () => {
    getCurrentUserId.mockResolvedValue('user-1')
    repository.updateItem.mockResolvedValue({ id: '3' })
    repository.getItemById.mockResolvedValue({
      id: '3',
      user_id: 'user-1',
      title: '味噌湯',
      image_url: 'https://example.com/a.jpg',
      cook_time_minutes: 10,
      difficulty: '簡單',
      description: '暖胃湯品',
      tags: ['湯品'],
      favorite_recipes: [],
      created_at: '2026-09-02T00:00:00Z',
      updated_at: '2026-09-03T00:00:00Z',
    })

    await updateRecipe('3', {
      imageUrl: 'https://example.com/a.jpg',
      cookTimeMinutes: 10,
      difficulty: '簡單',
      description: '暖胃湯品',
      tags: ['湯品'],
    })

    expect(repository.updateItem).toHaveBeenCalledWith('3', {
      image_url: 'https://example.com/a.jpg',
      cook_time_minutes: 10,
      difficulty: '簡單',
      description: '暖胃湯品',
      tags: ['湯品'],
    })
  })

  it('updateRecipe replaces only the steps when ingredients are not included', async () => {
    getCurrentUserId.mockResolvedValue('user-1')
    repository.deleteSteps.mockResolvedValue(undefined)
    repository.createSteps.mockResolvedValue([])
    repository.getItemById.mockResolvedValue({
      id: '3',
      user_id: 'user-1',
      title: '味噌湯',
      image_url: null,
      cook_time_minutes: null,
      difficulty: null,
      description: null,
      tags: [],
      favorite_recipes: [],
      created_at: '2026-09-02T00:00:00Z',
      updated_at: '2026-09-02T00:00:00Z',
      recipe_ingredients: [],
      recipe_steps: [],
    })

    await updateRecipe('3', { steps: [{ description: '關火' }] })

    expect(repository.deleteIngredients).not.toHaveBeenCalled()
    expect(repository.createIngredients).not.toHaveBeenCalled()
    expect(repository.deleteSteps).toHaveBeenCalledWith('3')
    expect(repository.createSteps).toHaveBeenCalledWith([
      { recipe_id: '3', description: '關火', sort_order: 0 },
    ])
  })

  it('updateRecipe does not call updateItem when only ingredients/steps change', async () => {
    getCurrentUserId.mockResolvedValue('user-1')
    repository.deleteIngredients.mockResolvedValue(undefined)
    repository.createIngredients.mockResolvedValue([])
    repository.getItemById.mockResolvedValue({
      id: '3',
      user_id: 'user-1',
      title: '味噌湯',
      image_url: null,
      cook_time_minutes: null,
      difficulty: null,
      description: null,
      tags: [],
      favorite_recipes: [],
      created_at: '2026-09-02T00:00:00Z',
      updated_at: '2026-09-02T00:00:00Z',
      recipe_ingredients: [],
      recipe_steps: [],
    })

    await updateRecipe('3', { ingredients: [{ name: '味噌', amount: '' }] })

    expect(repository.updateItem).not.toHaveBeenCalled()
    expect(repository.deleteSteps).not.toHaveBeenCalled()
    expect(repository.createSteps).not.toHaveBeenCalled()
  })

  it('deleteRecipe delegates to the repository', async () => {
    repository.deleteItem.mockResolvedValue(undefined)

    await deleteRecipe('4')

    expect(repository.deleteItem).toHaveBeenCalledWith('4')
  })

  it('toggleFavorite creates a favorite_recipes row when currentValue is false', async () => {
    getCurrentUserId.mockResolvedValue('user-1')
    favoriteRepository.createFavorite.mockResolvedValue(undefined)
    repository.getItemById.mockResolvedValue({
      id: '3',
      user_id: 'user-1',
      title: '味噌湯',
      image_url: null,
      cook_time_minutes: null,
      difficulty: null,
      description: null,
      tags: [],
      favorite_recipes: [{ user_id: 'user-1' }],
      created_at: '2026-09-02T00:00:00Z',
      updated_at: '2026-09-02T00:00:00Z',
    })

    const recipe = await toggleFavorite('3', false)

    expect(favoriteRepository.createFavorite).toHaveBeenCalledWith({
      user_id: 'user-1',
      recipe_id: '3',
    })
    expect(favoriteRepository.deleteFavorite).not.toHaveBeenCalled()
    expect(recipe.isFavorite).toBe(true)
  })

  it('toggleFavorite deletes the favorite_recipes row when currentValue is true', async () => {
    getCurrentUserId.mockResolvedValue('user-1')
    favoriteRepository.deleteFavorite.mockResolvedValue(undefined)
    repository.getItemById.mockResolvedValue({
      id: '3',
      user_id: 'user-1',
      title: '味噌湯',
      image_url: null,
      cook_time_minutes: null,
      difficulty: null,
      description: null,
      tags: [],
      favorite_recipes: [],
      created_at: '2026-09-02T00:00:00Z',
      updated_at: '2026-09-02T00:00:00Z',
    })

    const recipe = await toggleFavorite('3', true)

    expect(favoriteRepository.deleteFavorite).toHaveBeenCalledWith('user-1', '3')
    expect(favoriteRepository.createFavorite).not.toHaveBeenCalled()
    expect(recipe.isFavorite).toBe(false)
  })
})
