'use client'

import React from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class AIErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[AI Error Boundary]', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="p-4 flex flex-col items-center gap-3 text-center">
          <div className="p-2 rounded-full bg-red-50 dark:bg-red-900/20">
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Terjadi kesalahan
            </p>
            <p className="text-[10px] text-gray-500 mt-1">
              {this.state.error?.message || 'AI component mengalami error'}
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="text-[10px] px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
