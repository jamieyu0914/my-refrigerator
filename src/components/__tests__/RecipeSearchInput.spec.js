import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RecipeSearchInput from '../RecipeSearchInput.vue'

describe('RecipeSearchInput.vue', () => {
  it('renders the modelValue as the input value', () => {
    const wrapper = mount(RecipeSearchInput, { props: { modelValue: '雞蛋' } })

    expect(wrapper.find('input').element.value).toBe('雞蛋')
  })

  it('emits update:modelValue when the user types', async () => {
    const wrapper = mount(RecipeSearchInput, { props: { modelValue: '' } })

    await wrapper.find('input').setValue('炒飯')

    expect(wrapper.emitted('update:modelValue')).toEqual([['炒飯']])
  })
})
