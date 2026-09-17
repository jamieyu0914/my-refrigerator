import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AiRecognitionResult from '../AiRecognitionResult.vue'

const items = [
  { tempId: '1', name: '雞蛋', category: '其他', emoji: '🍽️', confidence: 0.95, selected: true },
  { tempId: '2', name: '番茄', category: '蔬果', emoji: '🥬', confidence: 0.4, selected: false },
]

function mountResult(props) {
  return mount(AiRecognitionResult, { props, global: { stubs: { RouterLink: true } } })
}

describe('AiRecognitionResult.vue', () => {
  it('shows an empty-state message with a manual-add link when there are no items', () => {
    // A plain `true` stub never invokes RouterLink's default slot, so the link text would
    // never actually render/execute - use a template stub here to cover that content too.
    const wrapper = mount(AiRecognitionResult, {
      props: { items: [] },
      global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
    })

    expect(wrapper.text()).toContain('沒有辨識到食材')
    expect(wrapper.text()).toContain('手動新增')
  })

  it('renders each item name, category and emoji', () => {
    const wrapper = mountResult({ items })

    expect(wrapper.text()).toContain('🍽️')
    expect(wrapper.find('.item-name').element.value).toBe('雞蛋')
  })

  it('reflects each item selected state on its checkbox', () => {
    const wrapper = mountResult({ items })
    const checkboxes = wrapper.findAll('input[type="checkbox"]')

    expect(checkboxes[0].element.checked).toBe(true)
    expect(checkboxes[1].element.checked).toBe(false)
  })

  it('flags a low-confidence item for review', () => {
    const wrapper = mountResult({ items })
    const rows = wrapper.findAll('.item-row')

    expect(rows[0].text()).not.toContain('請確認')
    expect(rows[1].text()).toContain('請確認')
  })

  it('emits toggle with the item tempId when its checkbox changes', async () => {
    const wrapper = mountResult({ items })

    await wrapper.findAll('input[type="checkbox"]')[0].trigger('change')

    expect(wrapper.emitted('toggle')).toEqual([['1']])
  })

  it('emits update-name when the name field changes', async () => {
    const wrapper = mountResult({ items })
    const nameInput = wrapper.find('.item-name')

    nameInput.element.value = '茶葉蛋'
    await nameInput.trigger('change')

    expect(wrapper.emitted('update-name')).toEqual([['1', '茶葉蛋']])
  })

  it('emits update-category when the category select changes', async () => {
    const wrapper = mountResult({ items })
    const select = wrapper.find('.item-category')

    await select.setValue('肉類')

    expect(wrapper.emitted('update-category')).toEqual([['1', '肉類']])
  })

  it('emits remove with the item tempId', async () => {
    const wrapper = mountResult({ items })

    await wrapper.findAll('.remove')[1].trigger('click')

    expect(wrapper.emitted('remove')).toEqual([['2']])
  })

  it('emits confirm when the confirm button is clicked', async () => {
    const wrapper = mountResult({ items })

    await wrapper.find('.confirm-button').trigger('click')

    expect(wrapper.emitted('confirm')).toBeTruthy()
  })

  it('disables the confirm button while submitting', () => {
    const wrapper = mountResult({ items, isSubmitting: true })

    expect(wrapper.find('.confirm-button').attributes('disabled')).toBeDefined()
  })

  it('disables the confirm button when no item is selected', () => {
    const wrapper = mountResult({ items: items.map((item) => ({ ...item, selected: false })) })

    expect(wrapper.find('.confirm-button').attributes('disabled')).toBeDefined()
  })
})
