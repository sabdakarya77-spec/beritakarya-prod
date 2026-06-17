import { useState, useCallback } from 'react'
import { api } from '../lib/api'

export interface UploadResult {
  url: string
  thumbUrl: string
  width: number
  height: number
  size: number
}

interface UploadState {
  uploading: boolean
  progress: number
  error: string | null
  result: UploadResult | null
}

/**
 * Custom hook reusable untuk upload gambar
 * Menangani state progress, error, dan hasil upload
 * Digunakan oleh semua block gambar di CMS
 */
export function useImageUpload() {
  const [state, setState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
    result: null
  })

  const upload = useCallback(async (file: File): Promise<UploadResult | null> => {
    // 1. Validasi client-side
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowed.includes(file.type)) {
      setState(s => ({ ...s, error: 'Format file tidak didukung (JPG, PNG, WebP, GIF)' }))
      return null
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      setState(s => ({ ...s, error: 'Ukuran file melebihi 10MB' }))
      return null
    }

    // 2. Start Upload State
    setState({ uploading: true, progress: 5, error: null, result: null })

    const form = new FormData()
    form.append('file', file)

    try {
      // 3. Request ke API
      const { data } = await api.post('/media/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: e => {
          if (e.total) {
            // Berhenti di 90% sampai server merespon sukses
            setState(s => ({ ...s, progress: Math.round(e.loaded / e.total! * 90) }))
          }
        }
      })

      const result: UploadResult = data.data
      
      // 4. Success State
      setState({ uploading: false, progress: 100, error: null, result })
      return result

    } catch (err: unknown) {
      // 5. Error Handling
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } }
      const msg = axiosErr.response?.data?.error?.message || 'Upload gagal, coba lagi'
      setState({ uploading: false, progress: 0, error: msg, result: null })
      return null
    }
  }, [])

  const reset = useCallback(() => {
    setState({ uploading: false, progress: 0, error: null, result: null })
  }, [])

  return { ...state, upload, reset }
}
