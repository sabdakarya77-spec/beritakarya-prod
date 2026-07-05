import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-plus-jakarta-sans)', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
      },
      colors: {
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        brand: {
          red: 'rgb(var(--brand-red-rgb) / <alpha-value>)',
          black: 'rgb(var(--brand-black-rgb) / <alpha-value>)',
          dark: 'rgb(var(--brand-dark-rgb) / <alpha-value>)',
          grey: 'rgb(var(--brand-grey-rgb) / <alpha-value>)',
          surface: 'rgb(var(--brand-surface-rgb) / <alpha-value>)',
          text: 'rgb(var(--brand-text-rgb) / <alpha-value>)',
          'text-muted': 'rgb(var(--brand-text-muted-rgb) / <alpha-value>)',
        },
        border: "hsl(var(--border))",
        panel: {
          bg: 'var(--panel-bg)',
          surface: 'var(--panel-surface)',
          elevated: 'var(--panel-elevated)',
          border: 'var(--panel-border)',
          'border-hover': 'var(--panel-border-hover)',
          accent: 'var(--accent-red)',
          'accent-muted': 'var(--accent-red-muted)',
          amber: 'var(--accent-amber)',
          purple: 'var(--accent-purple)',
          'text-primary': 'var(--panel-text-primary)',
          'text-secondary': 'var(--panel-text-secondary)',
          'text-muted': 'var(--panel-text-muted)',
        },
      },
      animation: {
        'marquee': 'marquee 25s linear infinite',
        'ticker': 'ticker 40s linear infinite',
        'fade-slide-up': 'fadeSlideUp 0.3s ease-out',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        ticker: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        fadeSlideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      /* ==================== CONTAINER SYSTEM TOKENS ==================== */
      spacing: {
        'container-mobile': 'var(--container-padding-mobile)',
        'container-tablet': 'var(--container-padding-tablet)',
        'container-desktop': 'var(--container-padding-desktop)',
      },
      maxWidth: {
        'container': 'var(--container-max-width)',
        'content': 'var(--content-max-width)',
        'wide': 'var(--wide-max-width)',
      },
      borderRadius: {
        'card': 'var(--radius-card)',
        'button': 'var(--radius-button)',
        'input': 'var(--radius-input)',
      }
    },
  },
  plugins: [],
}
export default config
