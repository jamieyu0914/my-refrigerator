import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import PromotionSearchBar from '../PromotionSearchBar.vue'
import { PROMOTION_SORTS } from '../../utils/constants'

describe('PromotionSearchBar.vue', () => {
  it('renders the query and the selected sort', () => {
    const wrapper = mount(PromotionSearchBar, { props: { query: '鮭魚', sort: 'price_asc' } })

    expect(wrapper.find('input').element.value).toBe('鮭魚')
    expect(wrapper.find('select').element.value).toBe('price_asc')
  })

  it('offers every PROMOTION_SORTS option', () => {
    const wrapper = mount(PromotionSearchBar)

    expect(wrapper.findAll('option').map((o) => [o.element.value, o.text()])).toEqual(
      PROMOTION_SORTS.map((s) => [s.value, s.label]),
    )
  })

  it('emits update:query when the user types', async () => {
    const wrapper = mount(PromotionSearchBar)

    await wrapper.find('input').setValue('牛奶')

    expect(wrapper.emitted('update:query')).toEqual([['牛奶']])
  })

  it('emits update:sort when the user picks a sort', async () => {
    const wrapper = mount(PromotionSearchBar)

    await wrapper.find('select').setValue('price_desc')

    expect(wrapper.emitted('update:sort')).toEqual([['price_desc']])
  })
})
