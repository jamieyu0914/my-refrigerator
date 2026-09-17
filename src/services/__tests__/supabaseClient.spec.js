import { beforeEach, describe, expect, it, vi } from 'vitest'

// vi.mock is hoisted above imports, so anything its factory references must go through
// vi.hoisted - lets getCurrentUserId run for real against a controllable fake client instead
// of the real @supabase/supabase-js client every other test file mocks away entirely.
const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ auth: { getSession } })),
}))

const { getCurrentUserId } = await import('../supabaseClient')

describe('supabaseClient', () => {
  beforeEach(() => {
    getSession.mockReset()
  })

  it('getCurrentUserId returns the current session user id', async () => {
    getSession.mockResolvedValue({ data: { session: { user: { id: 'user-1' } } }, error: null })

    const userId = await getCurrentUserId()

    expect(userId).toBe('user-1')
  })

  it('getCurrentUserId returns undefined when there is no session', async () => {
    getSession.mockResolvedValue({ data: { session: null }, error: null })

    const userId = await getCurrentUserId()

    expect(userId).toBeUndefined()
  })

  it('getCurrentUserId throws when supabase returns an error', async () => {
    getSession.mockResolvedValue({ data: { session: null }, error: new Error('session error') })

    await expect(getCurrentUserId()).rejects.toThrow('session error')
  })
})
