import { useState, useCallback } from 'react'
import type { AIState } from './types'

interface BackendAIResult<T> {
  success: boolean
  data?: T
  error?: string
}

async function callBackendAPI<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`/api/v1/ai/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
  })

  if (response.status === 403) {
    const data = await response.json().catch(() => ({}))
    if (data.error?.code === 'CONSENT_REQUIRED') {
      throw new Error('CONSENT_REQUIRED')
    }
    throw new Error(data.error?.message || 'Access denied')
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.error?.message || 'AI request failed')
  }

  const result: BackendAIResult<T> = await response.json()
  if (!result.success) {
    throw new Error(result.error || 'AI request failed')
  }
  return result.data as T
}

export function createAIHook<TInput, TOutput, TMethodName extends string>(config: {
  endpoint: string
  methodName: TMethodName
  buildPayload: (input: TInput) => Record<string, unknown>
  transformResult: (raw: any, input: TInput) => TOutput
  errorMessage: string
}) {
  return function useGeneratedHook() {
    const [state, setState] = useState<AIState<TOutput>>({
      loading: false,
      result: null,
      error: null,
    })

    const run = useCallback(async (input: TInput) => {
      setState({ loading: true, result: null, error: null })

      try {
        const payload = config.buildPayload(input)
        const rawData = await callBackendAPI<any>(config.endpoint, payload)
        const transformed = config.transformResult(rawData, input)

        setState({
          loading: false,
          result: transformed,
          error: null,
        })
      } catch (error) {
        setState({
          loading: false,
          result: null,
          error: error instanceof Error ? error.message : config.errorMessage,
        })
      }
    }, [setState])

    return {
      ...state,
      [config.methodName]: run,
    } as AIState<TOutput> & Record<TMethodName, (input: TInput) => Promise<void>>
  }
}
