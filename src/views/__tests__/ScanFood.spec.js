import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, shallowMount } from '@vue/test-utils'
import ScanFood from '../ScanFood.vue'
import ImageCapture from '../../components/ImageCapture.vue'
import AiRecognitionResult from '../../components/AiRecognitionResult.vue'
import { useAiVisionStore } from '../../stores/aiVision'

const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('../../stores/aiVision', () => ({
  useAiVisionStore: vi.fn(),
}))

function mountWithStore(overrides = {}) {
  useAiVisionStore.mockReturnValue({
    recognizedItems: [],
    analyzeImage: vi.fn().mockResolvedValue(undefined),
    updateItem: vi.fn(),
    removeItem: vi.fn(),
    discard: vi.fn(),
    confirmSelected: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  })

  return shallowMount(ScanFood)
}

describe('ScanFood.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not show a recognition result before any photo is analyzed', () => {
    const wrapper = mountWithStore()

    expect(wrapper.findComponent(AiRecognitionResult).exists()).toBe(false)
  })

  it('shows a loading message while analyzing, and calls analyzeImage with the selected file', async () => {
    let resolveAnalyze
    const analyzeImage = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveAnalyze = resolve
        }),
    )
    const wrapper = mountWithStore({ analyzeImage })
    const file = new File([], 'a.jpg')

    wrapper.findComponent(ImageCapture).vm.$emit('select', file)
    await flushPromises()

    expect(analyzeImage).toHaveBeenCalledWith(file)
    expect(wrapper.text()).toContain('辨識中')

    resolveAnalyze()
    await flushPromises()

    expect(wrapper.text()).not.toContain('辨識中')
  })

  it('shows the recognition result once analysis succeeds', async () => {
    const recognizedItems = [{ tempId: '1', name: '雞蛋', selected: true }]
    const wrapper = mountWithStore({ recognizedItems })

    wrapper.findComponent(ImageCapture).vm.$emit('select', new File([], 'a.jpg'))
    await flushPromises()

    expect(wrapper.findComponent(AiRecognitionResult).props('items')).toEqual(recognizedItems)
  })

  it('shows an error message and no result when analysis fails', async () => {
    const wrapper = mountWithStore({ analyzeImage: vi.fn().mockRejectedValue(new Error('fail')) })

    wrapper.findComponent(ImageCapture).vm.$emit('select', new File([], 'a.jpg'))
    await flushPromises()

    expect(wrapper.text()).toContain('辨識失敗')
    expect(wrapper.findComponent(AiRecognitionResult).exists()).toBe(false)
  })

  it('toggles the selected item through the store', async () => {
    const updateItem = vi.fn()
    const recognizedItems = [{ tempId: '1', name: '雞蛋', selected: true }]
    const wrapper = mountWithStore({ recognizedItems, updateItem })
    wrapper.findComponent(ImageCapture).vm.$emit('select', new File([], 'a.jpg'))
    await flushPromises()

    wrapper.findComponent(AiRecognitionResult).vm.$emit('toggle', '1')

    expect(updateItem).toHaveBeenCalledWith('1', { selected: false })
  })

  it('confirms selected items and navigates to the refrigerator on success', async () => {
    const confirmSelected = vi.fn().mockResolvedValue(undefined)
    const recognizedItems = [{ tempId: '1', name: '雞蛋', selected: true }]
    const wrapper = mountWithStore({ recognizedItems, confirmSelected })
    wrapper.findComponent(ImageCapture).vm.$emit('select', new File([], 'a.jpg'))
    await flushPromises()

    wrapper.findComponent(AiRecognitionResult).vm.$emit('confirm')
    await flushPromises()

    expect(confirmSelected).toHaveBeenCalled()
    expect(mockPush).toHaveBeenCalledWith({ name: 'refrigerator' })
  })

  it('shows an error and stays on the page when confirming fails', async () => {
    const confirmSelected = vi.fn().mockRejectedValue(new Error('1 項加入失敗'))
    const recognizedItems = [{ tempId: '1', name: '雞蛋', selected: true }]
    const wrapper = mountWithStore({ recognizedItems, confirmSelected })
    wrapper.findComponent(ImageCapture).vm.$emit('select', new File([], 'a.jpg'))
    await flushPromises()

    wrapper.findComponent(AiRecognitionResult).vm.$emit('confirm')
    await flushPromises()

    expect(wrapper.text()).toContain('部分項目加入失敗')
    expect(mockPush).not.toHaveBeenCalled()
  })
})
