import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ExpiryBadge from '../ExpiryBadge.vue'

function daysFromToday(days) {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

describe('ExpiryBadge.vue', () => {
  it('shows "未設定到期日" and badge-none when there is no expiry date', () => {
    const wrapper = mount(ExpiryBadge, { props: { expiryDate: null } })

    expect(wrapper.text()).toBe('未設定到期日')
    expect(wrapper.classes()).toContain('badge-none')
  })

  it('shows "已過期" and badge-expired for a past date', () => {
    const wrapper = mount(ExpiryBadge, { props: { expiryDate: daysFromToday(-2) } })

    expect(wrapper.text()).toBe('已過期')
    expect(wrapper.classes()).toContain('badge-expired')
  })

  it('shows "即將到期" and badge-soon for a date within 3 days', () => {
    const wrapper = mount(ExpiryBadge, { props: { expiryDate: daysFromToday(2) } })

    expect(wrapper.text()).toBe('即將到期')
    expect(wrapper.classes()).toContain('badge-soon')
  })

  it('shows the raw date and badge-ok for a date further away', () => {
    const expiryDate = daysFromToday(30)
    const wrapper = mount(ExpiryBadge, { props: { expiryDate } })

    expect(wrapper.text()).toBe(expiryDate)
    expect(wrapper.classes()).toContain('badge-ok')
  })
})
