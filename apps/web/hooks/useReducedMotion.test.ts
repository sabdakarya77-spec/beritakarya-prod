import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePrefersReducedMotion, useSafeMotion } from './useReducedMotion'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  useReducedMotion: vi.fn(),
}))

import { useReducedMotion } from 'framer-motion'

describe('usePrefersReducedMotion', () => {
  it('returns true when framer-motion reports reduced motion', () => {
    vi.mocked(useReducedMotion).mockReturnValue(true)
    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(true)
  })

  it('returns false when framer-motion reports no reduced motion', () => {
    vi.mocked(useReducedMotion).mockReturnValue(false)
    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(false)
  })

  it('returns false when framer-motion returns undefined', () => {
    vi.mocked(useReducedMotion).mockReturnValue(undefined as unknown as null)
    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(false)
  })
})

describe('useSafeMotion', () => {
  it('returns empty object when reduced motion is preferred', () => {
    vi.mocked(useReducedMotion).mockReturnValue(true)
    const motionProps = { animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } }
    const { result } = renderHook(() => useSafeMotion(motionProps))
    expect(result.current).toEqual({})
  })

  it('returns motion props when reduced motion is not preferred', () => {
    vi.mocked(useReducedMotion).mockReturnValue(false)
    const motionProps = { animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } }
    const { result } = renderHook(() => useSafeMotion(motionProps))
    expect(result.current).toEqual(motionProps)
  })

  it('returns motion props when framer-motion returns undefined (defaults to false)', () => {
    vi.mocked(useReducedMotion).mockReturnValue(undefined as unknown as null)
    const motionProps = { animate: { opacity: 1 } }
    const { result } = renderHook(() => useSafeMotion(motionProps))
    // undefined ?? false = false → reduced motion is NOT preferred
    expect(result.current).toEqual(motionProps)
  })
})
