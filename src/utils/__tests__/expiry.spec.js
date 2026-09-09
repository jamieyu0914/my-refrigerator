import { describe, expect, it } from 'vitest'
import { getExpiryStatus } from '../expiry'

function daysFromToday(days) {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

describe('getExpiryStatus', () => {
  it('returns "none" when no expiry date is given', () => {
    expect(getExpiryStatus(null)).toBe('none')
    expect(getExpiryStatus(undefined)).toBe('none')
    expect(getExpiryStatus('')).toBe('none')
  })

  it('returns "expired" for a date in the past', () => {
    expect(getExpiryStatus(daysFromToday(-1))).toBe('expired')
  })

  it('returns "soon" for today and for dates within 3 days', () => {
    expect(getExpiryStatus(daysFromToday(0))).toBe('soon')
    expect(getExpiryStatus(daysFromToday(3))).toBe('soon')
  })

  it('returns "ok" for dates further than 3 days away', () => {
    expect(getExpiryStatus(daysFromToday(4))).toBe('ok')
    expect(getExpiryStatus(daysFromToday(30))).toBe('ok')
  })
})
