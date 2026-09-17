import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ImageCapture from '../ImageCapture.vue'

function makeFile() {
  return new File(['fake-image-bytes'], 'photo.jpg', { type: 'image/jpeg' })
}

describe('ImageCapture.vue', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock-preview'),
      revokeObjectURL: vi.fn(),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows the initial picker label and no preview', () => {
    const wrapper = mount(ImageCapture)

    expect(wrapper.text()).toContain('拍照或選擇照片')
    expect(wrapper.find('.preview').exists()).toBe(false)
  })

  it('emits select with the chosen file and shows a preview', async () => {
    const wrapper = mount(ImageCapture)
    const file = makeFile()
    const input = wrapper.find('input[type="file"]')

    Object.defineProperty(input.element, 'files', { value: [file] })
    await input.trigger('change')

    expect(wrapper.emitted('select')).toEqual([[file]])
    expect(wrapper.find('.preview').attributes('src')).toBe('blob:mock-preview')
    expect(wrapper.text()).toContain('重新選擇照片')
  })

  it('clicking the pick button opens the file dialog', async () => {
    const wrapper = mount(ImageCapture)
    const input = wrapper.find('input[type="file"]')
    const clickSpy = vi.spyOn(input.element, 'click')

    await wrapper.find('.pick-button').trigger('click')

    expect(clickSpy).toHaveBeenCalled()
  })
})
