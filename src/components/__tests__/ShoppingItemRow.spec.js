import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ShoppingItemRow from '../ShoppingItemRow.vue'

const item = { id: '1', name: '牛奶', quantity: 1, unit: '瓶', category: '乳製品', purchased: false }

describe('ShoppingItemRow.vue (read mode)', () => {
  it('renders the item name and quantity', () => {
    const wrapper = mount(ShoppingItemRow, { props: { item } })

    expect(wrapper.find('.item-name').text()).toBe('牛奶')
    expect(wrapper.find('.item-qty').text()).toBe('1瓶')
  })

  it('reflects the purchased state on the checkbox and applies the purchased class', () => {
    const wrapper = mount(ShoppingItemRow, { props: { item: { ...item, purchased: true } } })

    expect(wrapper.find('input[type="checkbox"]').element.checked).toBe(true)
    expect(wrapper.find('.item-text').classes()).toContain('purchased')
  })

  it('emits toggle with the item id when the checkbox changes', async () => {
    const wrapper = mount(ShoppingItemRow, { props: { item } })

    await wrapper.find('input[type="checkbox"]').setValue(true)

    expect(wrapper.emitted('toggle')).toEqual([['1']])
  })

  it('disables the checkbox while toggling', () => {
    const wrapper = mount(ShoppingItemRow, { props: { item, toggling: true } })

    expect(wrapper.find('input[type="checkbox"]').attributes('disabled')).toBeDefined()
  })

  it('emits edit-start when the edit button is clicked', async () => {
    const wrapper = mount(ShoppingItemRow, { props: { item } })

    await wrapper.find('[aria-label="編輯"]').trigger('click')

    expect(wrapper.emitted('edit-start')).toEqual([['1']])
  })

  it('emits delete when the delete button is clicked, and disables it while deleting', async () => {
    const wrapper = mount(ShoppingItemRow, { props: { item, deleting: true } })

    expect(wrapper.find('[aria-label="刪除"]').attributes('disabled')).toBeDefined()

    await wrapper.setProps({ deleting: false })
    await wrapper.find('[aria-label="刪除"]').trigger('click')

    expect(wrapper.emitted('delete')).toEqual([['1']])
  })
})

describe('ShoppingItemRow.vue (edit mode)', () => {
  it('defaults the unit draft to an empty string when the item has no unit', async () => {
    const itemWithoutUnit = { ...item, unit: undefined }
    const wrapper = mount(ShoppingItemRow, { props: { item: itemWithoutUnit, editing: true } })

    expect(wrapper.find('.edit-unit').element.value).toBe('')

    await wrapper.setProps({ editing: false })
    await wrapper.setProps({ editing: true })

    expect(wrapper.find('.edit-unit').element.value).toBe('')
  })

  it('renders a form pre-filled with the item values', () => {
    const wrapper = mount(ShoppingItemRow, { props: { item, editing: true } })

    expect(wrapper.find('.edit-name').element.value).toBe('牛奶')
    expect(wrapper.find('.edit-quantity').element.value).toBe('1')
    expect(wrapper.find('.edit-unit').element.value).toBe('瓶')
    expect(wrapper.find('.edit-category').element.value).toBe('乳製品')
  })

  it('resets the draft fields whenever editing turns back on', async () => {
    const wrapper = mount(ShoppingItemRow, { props: { item, editing: false } })

    await wrapper.setProps({ editing: true })
    expect(wrapper.find('.edit-name').element.value).toBe('牛奶')

    await wrapper.find('.edit-name').setValue('全脂牛奶')
    await wrapper.setProps({ editing: false })
    await wrapper.setProps({ editing: true })

    expect(wrapper.find('.edit-name').element.value).toBe('牛奶')
  })

  it('emits edit-save with trimmed, normalized values on submit', async () => {
    const wrapper = mount(ShoppingItemRow, { props: { item, editing: true } })

    await wrapper.find('.edit-name').setValue('  全脂牛奶  ')
    await wrapper.find('.edit-quantity').setValue('3')
    await wrapper.find('.edit-unit').setValue('  瓶裝 ')
    await wrapper.find('.edit-category').setValue('其他')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('edit-save')).toEqual([
      [
        {
          id: '1',
          updates: { name: '全脂牛奶', quantity: 3, unit: '瓶裝', category: '其他' },
        },
      ],
    ])
  })

  it('defaults quantity to 1 when the field is not a valid number', async () => {
    const wrapper = mount(ShoppingItemRow, { props: { item, editing: true } })

    await wrapper.find('.edit-quantity').setValue('')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('edit-save')[0][0].updates.quantity).toBe(1)
  })

  it('does not emit edit-save when the trimmed name is empty', async () => {
    const wrapper = mount(ShoppingItemRow, { props: { item, editing: true } })

    await wrapper.find('.edit-name').setValue('   ')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('edit-save')).toBeUndefined()
  })

  it('emits edit-cancel when cancel is clicked', async () => {
    const wrapper = mount(ShoppingItemRow, { props: { item, editing: true } })

    await wrapper.find('.cancel').trigger('click')

    expect(wrapper.emitted('edit-cancel')).toHaveLength(1)
  })

  it('disables both the save and cancel buttons while saving', () => {
    const wrapper = mount(ShoppingItemRow, { props: { item, editing: true, saving: true } })

    expect(wrapper.find('.save').attributes('disabled')).toBeDefined()
    expect(wrapper.find('.cancel').attributes('disabled')).toBeDefined()
    expect(wrapper.find('.save').text()).toBe('儲存中…')
  })
})
