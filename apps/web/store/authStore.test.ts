import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuthStore } from './authStore'
import { api } from '../lib/api'

vi.mock('../lib/api', () => ({
  api: {
    post: vi.fn()
  }
}))

const mockResponse = {
  data: {
    success: true,
    data: {
      accessToken:  'access-token-123',
      refreshToken: 'refresh-token-456',
      user: {
        id: 'u-1', email: 'test@bandung.com',
        name: 'Test', role: 'reporter', siteId: 'bandung',
        isVerified: false, kycStatus: 'UNSUBMITTED', kycNotes: null, kycSubmittedAt: null
      }
    }
  }
}

describe('authStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    useAuthStore.setState({ user: null, isLoading: false, error: null })
  })

  it('login set user', async () => {
    vi.mocked(api.post).mockResolvedValue(mockResponse)

    await useAuthStore.getState().login('test@bandung.com', 'password123')

    expect(useAuthStore.getState().user?.email).toBe('test@bandung.com')
    expect(useAuthStore.getState().isLoading).toBe(false)
  })

  it('login gagal set error state', async () => {
    vi.mocked(api.post).mockRejectedValue({
      response: { data: { error: { message: 'Email atau password salah' } } }
    })

    await useAuthStore.getState().login('test@bandung.com', 'salah').catch(() => {})

    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().error).toBe('Email atau password salah')
  })

  it('logout menghapus user', async () => {
    useAuthStore.setState({ user: { id: 'u-1', email: 'x', name: 'x', role: 'reporter', siteId: 'bandung', isVerified: false, kycStatus: 'UNSUBMITTED', kycNotes: null, kycSubmittedAt: null } })
    vi.mocked(api.post).mockResolvedValue({ data: {} })

    await useAuthStore.getState().logout()

    expect(useAuthStore.getState().user).toBeNull()
  })
})
