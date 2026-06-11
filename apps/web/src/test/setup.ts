import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter:   () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useParams:   () => ({ site: 'bandung' }),
  usePathname: () => '/',
  notFound:    vi.fn()
}))

// Mock Next.js image
vi.mock('next/image', () => ({
  default: (props: any) => props
}))

// Mock axios api client
vi.mock('../lib/api', () => ({
  api: {
    get:    vi.fn(),
    post:   vi.fn(),
    put:    vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    }
  }
}))

// localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem:   (k: string) => store[k] ?? null,
    setItem:   (k: string, v: string) => { store[k] = v },
    removeItem:(k: string) => { delete store[k] },
    clear:     () => { store = {} }
  }
})()
Object.defineProperty(window, 'localStorage', { value: localStorageMock })
