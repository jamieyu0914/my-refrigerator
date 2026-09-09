import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, shallowMount } from '@vue/test-utils'
import RecipeForm from '../RecipeForm.vue'
import { useRecipeStore } from '../../stores/recipe'

const mockRouteParams = {}
const mockPush = vi.fn()

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: mockRouteParams }),
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('../../stores/recipe', () => ({
  useRecipeStore: vi.fn(),
}))

function mountWithStore(overrides = {}) {
  useRecipeStore.mockReturnValue({
    fetchRecipe: vi.fn().mockResolvedValue(undefined),
    addRecipe: vi.fn().mockResolvedValue(undefined),
    updateRecipe: vi.fn().mockResolvedValue(undefined),
    deleteRecipe: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  })

  return shallowMount(RecipeForm)
}

async function fillMinimumValidForm(wrapper) {
  await wrapper.find('input[placeholder="例如：番茄炒蛋"]').setValue('番茄炒蛋')
  await wrapper.find('input[placeholder="名稱，例如：雞蛋"]').setValue('雞蛋')
  await wrapper.find('input[placeholder="份量，例如：3 顆"]').setValue('3 顆')
  await wrapper.find('input[placeholder="描述這個步驟"]').setValue('打散雞蛋')
}

describe('RecipeForm.vue (create mode)', () => {
  beforeEach(() => {
    delete mockRouteParams.id
    mockPush.mockClear()
    vi.clearAllMocks()
  })

  it('does not submit when the title is empty', async () => {
    const addRecipe = vi.fn()
    const wrapper = mountWithStore({ addRecipe })

    await wrapper.find('input[placeholder="名稱，例如：雞蛋"]').setValue('雞蛋')
    await wrapper.find('input[placeholder="描述這個步驟"]').setValue('打散雞蛋')
    await wrapper.find('form').trigger('submit')

    expect(addRecipe).not.toHaveBeenCalled()
  })

  it('does not submit when there are no non-empty ingredients or steps', async () => {
    const addRecipe = vi.fn()
    const wrapper = mountWithStore({ addRecipe })

    await wrapper.find('input[placeholder="例如：番茄炒蛋"]').setValue('番茄炒蛋')
    await wrapper.find('form').trigger('submit')

    expect(addRecipe).not.toHaveBeenCalled()
  })

  it('submits a trimmed/filtered payload and navigates to the recipe list', async () => {
    const addRecipe = vi.fn().mockResolvedValue(undefined)
    const wrapper = mountWithStore({ addRecipe })

    await fillMinimumValidForm(wrapper)
    await wrapper.find('input[placeholder="例如：快速, 家常菜"]').setValue('快速')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(addRecipe).toHaveBeenCalledWith({
      title: '番茄炒蛋',
      imageUrl: null,
      cookTimeMinutes: null,
      difficulty: '簡單',
      description: null,
      tags: ['快速'],
      ingredients: [{ name: '雞蛋', amount: '3 顆' }],
      steps: [{ description: '打散雞蛋' }],
    })
    expect(mockPush).toHaveBeenCalledWith({ name: 'recipes' })
  })

  it('shows an error message when the create submission fails', async () => {
    const addRecipe = vi.fn().mockRejectedValue(new Error('fail'))
    const wrapper = mountWithStore({ addRecipe })

    await fillMinimumValidForm(wrapper)
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('儲存失敗')
    expect(wrapper.find('.submit').attributes('disabled')).toBeUndefined()
  })

  it('adds and removes ingredient rows, disabling remove when only one is left', async () => {
    const wrapper = mountWithStore()

    expect(wrapper.findAll('.repeat-row')).toHaveLength(2)
    for (const button of wrapper.findAll('.remove')) {
      expect(button.attributes('disabled')).toBeDefined()
    }

    await wrapper.findAll('.add-row')[0].trigger('click')
    expect(wrapper.findAll('input[placeholder="名稱，例如：雞蛋"]')).toHaveLength(2)

    const removeButtons = wrapper.findAll('.remove')
    expect(removeButtons).toHaveLength(3)
    expect(removeButtons[0].attributes('disabled')).toBeUndefined()
    expect(removeButtons[1].attributes('disabled')).toBeUndefined()
    expect(removeButtons[2].attributes('disabled')).toBeDefined()

    await removeButtons[0].trigger('click')
    expect(wrapper.findAll('input[placeholder="名稱，例如：雞蛋"]')).toHaveLength(1)
    expect(wrapper.find('.remove').attributes('disabled')).toBeDefined()
  })

  it('does not show a delete button', () => {
    const wrapper = mountWithStore()

    expect(wrapper.find('.delete').exists()).toBe(false)
  })
})

describe('RecipeForm.vue (edit mode)', () => {
  const existingRecipe = {
    id: '5',
    title: '味噌湯',
    imageUrl: null,
    cookTimeMinutes: 10,
    difficulty: '簡單',
    description: '日式家庭的溫暖湯品',
    tags: ['湯品', '日式'],
    ingredients: [{ id: 'i1', name: '味噌', amount: '2 大匙' }],
    steps: [{ id: 's1', description: '煮開高湯' }],
  }

  beforeEach(() => {
    mockRouteParams.id = '5'
    mockPush.mockClear()
    vi.clearAllMocks()
  })

  it('shows a loading message, then loads the existing recipe into the form', async () => {
    const fetchRecipe = vi.fn().mockResolvedValue(existingRecipe)
    const wrapper = mountWithStore({ fetchRecipe })

    expect(wrapper.text()).toContain('載入中')

    await flushPromises()

    expect(fetchRecipe).toHaveBeenCalledWith('5')
    expect(wrapper.find('input[placeholder="例如：番茄炒蛋"]').element.value).toBe('味噌湯')
    expect(wrapper.find('input[placeholder="名稱，例如：雞蛋"]').element.value).toBe('味噌')
    expect(wrapper.find('input[placeholder="描述這個步驟"]').element.value).toBe('煮開高湯')
    expect(wrapper.text()).toContain('編輯食譜')
  })

  it('shows an error message when loading the existing recipe fails', async () => {
    const wrapper = mountWithStore({ fetchRecipe: vi.fn().mockRejectedValue(new Error('fail')) })

    await flushPromises()

    expect(wrapper.text()).toContain('載入食譜資料失敗')
  })

  it('submits updates via updateRecipe and navigates to the recipe detail page', async () => {
    const updateRecipe = vi.fn().mockResolvedValue(undefined)
    const wrapper = mountWithStore({
      fetchRecipe: vi.fn().mockResolvedValue(existingRecipe),
      updateRecipe,
    })
    await flushPromises()

    await wrapper.find('input[placeholder="例如：番茄炒蛋"]').setValue('味噌湯（更新）')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(updateRecipe).toHaveBeenCalledWith(
      '5',
      expect.objectContaining({ title: '味噌湯（更新）' }),
    )
    expect(mockPush).toHaveBeenCalledWith({ name: 'recipe-detail', params: { id: '5' } })
  })

  it('deletes the recipe on confirm and navigates back to the list', async () => {
    vi.stubGlobal('confirm', vi.fn(() => true))
    const deleteRecipe = vi.fn().mockResolvedValue(undefined)
    const wrapper = mountWithStore({
      fetchRecipe: vi.fn().mockResolvedValue(existingRecipe),
      deleteRecipe,
    })
    await flushPromises()

    await wrapper.find('.delete').trigger('click')
    await flushPromises()

    expect(deleteRecipe).toHaveBeenCalledWith('5')
    expect(mockPush).toHaveBeenCalledWith({ name: 'recipes' })

    vi.unstubAllGlobals()
  })
})
