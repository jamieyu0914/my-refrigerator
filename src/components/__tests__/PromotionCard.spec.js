import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import PromotionCard from '../PromotionCard.vue'

function promotion(overrides = {}) {
  return {
    id: 917355,
    name: '【溪和水產】海味精選組(任選3件)',
    category: '海鮮',
    sourceCategory: '冷藏冷凍>海鮮類',
    storeSource: '全聯全電商',
    salePrice: 700,
    marketPrice: 1000,
    discountRate: 0.3,
    referencePrice: null,
    badges: ['deep_discount'],
    imageUrl: 'https://b2eimg.pxec.com.tw/a.jpg',
    productUrl: 'https://pxbox.es.pxmart.com.tw/product/917355',
    lastSeenAt: '2026-10-01T22:00:00+00:00',
    ...overrides,
  }
}

describe('PromotionCard.vue', () => {
  it('renders the name, store source, category, prices and discount', () => {
    const wrapper = mount(PromotionCard, { props: { promotion: promotion() } })

    expect(wrapper.text()).toContain('【溪和水產】海味精選組(任選3件)')
    expect(wrapper.find('.store-source').text()).toBe('全聯全電商')
    expect(wrapper.find('.store-source').classes()).not.toContain('mega')
    expect(wrapper.text()).toContain('海鮮')
    expect(wrapper.find('strong').text()).toBe('$700')
    expect(wrapper.find('s').text()).toBe('$1000')
    expect(wrapper.find('.discount').text()).toBe('-30%')
    expect(wrapper.find('img').attributes('src')).toBe('https://b2eimg.pxec.com.tw/a.jpg')
  })

  it('styles 大全聯 products differently so the store source is unmistakable', () => {
    const wrapper = mount(PromotionCard, { props: { promotion: promotion({ storeSource: '大全聯' }) } })

    expect(wrapper.find('.store-source').text()).toBe('大全聯')
    expect(wrapper.find('.store-source').classes()).toContain('mega')
  })

  it('renders a label for every badge', () => {
    const wrapper = mount(PromotionCard, {
      props: { promotion: promotion({ badges: ['price_drop', 'discount_price', 'deep_discount'] }) },
    })

    expect(wrapper.findAll('.badge').map((b) => b.text())).toEqual([
      '🔻 降價',
      '🏷️ 折後價',
      '💯 下殺',
    ])
  })

  it('shows the 30-day reference price only when there is one', () => {
    const withReference = mount(PromotionCard, {
      props: { promotion: promotion({ badges: ['price_drop'], referencePrice: 850 }) },
    })
    const without = mount(PromotionCard, { props: { promotion: promotion() } })

    expect(withReference.find('.reference-price').text()).toContain('$850')
    expect(without.find('.reference-price').exists()).toBe(false)
  })

  it('omits the strikethrough price, discount and image when they are missing', () => {
    const wrapper = mount(PromotionCard, {
      props: { promotion: promotion({ marketPrice: null, discountRate: null, imageUrl: null }) },
    })

    expect(wrapper.find('s').exists()).toBe(false)
    expect(wrapper.find('.discount').exists()).toBe(false)
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('.promotion-thumb-fallback').exists()).toBe(true)
  })

  it('links to the product page in a new tab', () => {
    const wrapper = mount(PromotionCard, { props: { promotion: promotion() } })
    const link = wrapper.find('a')

    expect(link.attributes('href')).toBe('https://pxbox.es.pxmart.com.tw/product/917355')
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toBe('noopener noreferrer')
  })

  it('emits add-to-shopping-list with the promotion', async () => {
    const item = promotion()
    const wrapper = mount(PromotionCard, { props: { promotion: item } })

    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('add-to-shopping-list')).toEqual([[item]])
  })

  it('disables the add button while adding and once added', () => {
    const adding = mount(PromotionCard, { props: { promotion: promotion(), adding: true } })
    const added = mount(PromotionCard, { props: { promotion: promotion(), added: true } })

    expect(adding.find('button').attributes('disabled')).toBeDefined()
    expect(added.find('button').attributes('disabled')).toBeDefined()
    expect(added.find('button').text()).toBe('已加入採買清單')
  })
})
