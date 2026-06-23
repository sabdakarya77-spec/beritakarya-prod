'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

interface FadeInOnScrollProps {
  children: ReactNode
  className?: string
  delay?: number
}

export default function FadeInOnScroll({ children, className = '', delay = 0 }: FadeInOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [jsReady, setJsReady] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  // Mark JS as hydrated — only then apply fade animation
  useEffect(() => {
    setJsReady(true)
  }, [])

  useEffect(() => {
    if (!jsReady) return
    const el = ref.current
    if (!el) return

    // Fallback: check if element is already in viewport
    const checkAlreadyVisible = () => {
      const rect = el.getBoundingClientRect()
      const windowHeight = window.innerHeight || document.documentElement.clientHeight
      // Consider visible if element is within viewport (with some tolerance)
      const isVisible = rect.top < windowHeight && rect.bottom > 0
      if (isVisible) {
        if (delay > 0) {
          setTimeout(() => setIsVisible(true), delay)
        } else {
          setIsVisible(true)
        }
        return true
      }
      return false
    }

    // If already visible on mount, show immediately
    if (checkAlreadyVisible()) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delay > 0) {
            setTimeout(() => setIsVisible(true), delay)
          } else {
            setIsVisible(true)
          }
          observer.unobserve(el)
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [jsReady, delay])

  return (
    <div
      ref={ref}
      className={`${
        jsReady
          ? `transition-all duration-500 ease-out ${
              isVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-4'
            }`
          : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}
