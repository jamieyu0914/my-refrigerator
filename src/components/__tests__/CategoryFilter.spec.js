import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import CategoryFilter from '../CategoryFilter.vue'

const categories = ['蔬果', '肉類']

describe('CategoryFilter.vue', () => {
  it('renders an "全部" chip plus one chip per category', () => {
    const wrapper = mount(CategoryFilter, { props: { categories, modelValue: '' } })

    const chips = wrapper.findAll('.chip')
    expect(chips).toHaveLength(3)
    expect(chips[0].text()).toBe('全部')
    expect(chips[1].text()).toBe('蔬果')
    expect(chips[2].text()).toBe('肉類')
  })

  it('marks the "全部" chip active when modelValue is empty', () => {
    const wrapper = mount(CategoryFilter, { props: { categories, modelValue: '' } })

    const chips = wrapper.findAll('.chip')
    expect(chips[0].classes()).toContain('active')
    expect(chips[1].classes()).not.toContain('active')
  })

  it('marks the matching category chip active', () => {
    const wrapper = mount(CategoryFilter, { props: { categories, modelValue: '蔬果' } })

    const chips = wrapper.findAll('.chip')
    expect(chips[0].classes()).not.toContain('active')
    expect(chips[1].classes()).toContain('active')
  })

  it('emits update:modelValue with "" when the "全部" chip is clicked', async () => {
    const wrapper = mount(CategoryFilter, { props: { categories, modelValue: '蔬果' } })

    await wrapper.findAll('.chip')[0].trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([['']])
  })

  it('emits update:modelValue with the category when a category chip is clicked', async () => {
    const wrapper = mount(CategoryFilter, { props: { categories, modelValue: '' } })

    await wrapper.findAll('.chip')[2].trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([['肉類']])
  })
})
