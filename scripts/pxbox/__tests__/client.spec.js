import { describe, expect, it, vi } from 'vitest'
import { API_URL, fetchCategoryProducts, PAGE_SIZE } from '../client'

function jsonResponse(body, { ok = true, status = 200 } = {}) {
  return { ok, status, json: () => Promise.resolve(body) }
}

function page(productIds, totalPage) {
  return jsonResponse({
    code: '0000',
    message: 'Success',
    data: { product_list: productIds.map((id) => ({ id })), total_page: totalPage },
  })
}

describe('fetchCategoryProducts', () => {
  it('requests every page of the category and concatenates the products', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(page([1, 2], 2))
      .mockResolvedValueOnce(page([3], 2))
    const wait = vi.fn().mockResolvedValue(undefined)

    const products = await fetchCategoryProducts(1846, { fetchImpl, wait })

    expect(products).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }])
    expect(fetchImpl).toHaveBeenCalledTimes(2)

    const firstUrl = new URL(fetchImpl.mock.calls[0][0])
    expect(`${firstUrl.origin}${firstUrl.pathname}`).toBe(API_URL)
    expect(firstUrl.searchParams.get('CategoryId')).toBe('1846')
    expect(firstUrl.searchParams.get('depth')).toBe('2')
    expect(firstUrl.searchParams.get('PageIndex')).toBe('1')
    expect(firstUrl.searchParams.get('PageSize')).toBe(String(PAGE_SIZE))
    expect(new URL(fetchImpl.mock.calls[1][0]).searchParams.get('PageIndex')).toBe('2')
  })

  it('waits between page requests to rate-limit itself', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(page([1], 2))
      .mockResolvedValueOnce(page([2], 2))
    const wait = vi.fn().mockResolvedValue(undefined)

    await fetchCategoryProducts(1846, { fetchImpl, wait })

    expect(wait).toHaveBeenCalledWith(1000)
  })

  it('retries a failed request before succeeding', async () => {
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new Error('ECONNRESET'))
      .mockResolvedValueOnce(jsonResponse({}, { ok: false, status: 502 }))
      .mockResolvedValueOnce(page([1], 1))
    const wait = vi.fn().mockResolvedValue(undefined)

    const products = await fetchCategoryProducts(1846, { fetchImpl, wait })

    expect(products).toEqual([{ id: 1 }])
    expect(fetchImpl).toHaveBeenCalledTimes(3)
  })

  it('throws with the category and page after running out of attempts', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, { ok: false, status: 503 }))
    const wait = vi.fn().mockResolvedValue(undefined)

    await expect(fetchCategoryProducts(1846, { fetchImpl, wait })).rejects.toThrow(
      'category 1846 page 1: HTTP 503',
    )
    expect(fetchImpl).toHaveBeenCalledTimes(3)
  })

  it('treats an unexpected response shape as a failure instead of guessing', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(jsonResponse({ code: '9999', message: 'maintenance', data: null }))
    const wait = vi.fn().mockResolvedValue(undefined)

    await expect(fetchCategoryProducts(1846, { fetchImpl, wait })).rejects.toThrow(
      'unexpected response: code=9999 message=maintenance',
    )
  })
})
