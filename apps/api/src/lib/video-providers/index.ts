/**
 * Video Generation Providers
 *
 * Abstraction layer untuk berbagai AI video generator.
 * Setiap provider mengimplementasikan interface yang sama.
 *
 * Provider yang didukung:
 * - Seedance (ByteDance) — default, kualitas terbaik
 * - Kling (Kuaishou) — alternatif solid
 * - Hailuo AI (MiniMax) — budget option
 * - Pika — mudah dipakai
 * - Luma Dream Machine — gerakan natural
 * - Runway — premium, kualitas tertinggi
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type VideoProviderId = 'seedance' | 'kling' | 'hailuo' | 'pika' | 'luma' | 'runway'

export interface VideoGenerateRequest {
  prompt: string
  imageUrl?: string // Image-to-video (optional)
  duration?: number // Detik, default 10
  aspectRatio?: string // Misal: '960:240' atau '16:9'
}

export interface VideoGenerateResponse {
  success: boolean
  videoUrl?: string
  error?: string
  provider: VideoProviderId
  costEstimate?: number // USD
}

export interface VideoProvider {
  id: VideoProviderId
  name: string
  tier: 'budget' | 'standard' | 'premium'
  costPerSecond: number // USD
  maxDuration: number // Detik
  isAvailable(): boolean
  generate(request: VideoGenerateRequest): Promise<VideoGenerateResponse>
}

// ─── Provider Implementations ────────────────────────────────────────────────

import { SeedanceProvider } from './seedance'
import { KlingProvider } from './kling'
import { HailuoProvider } from './hailuo'
import { PikaProvider } from './pika'
import { LumaProvider } from './luma'
import { RunwayProvider } from './runway'

// ─── Provider Registry ──────────────────────────────────────────────────────

const providers: Record<VideoProviderId, VideoProvider> = {
  seedance: new SeedanceProvider(),
  kling: new KlingProvider(),
  hailuo: new HailuoProvider(),
  pika: new PikaProvider(),
  luma: new LumaProvider(),
  runway: new RunwayProvider(),
}

/**
 * Ambil provider berdasarkan ID
 */
export function getProvider(id: VideoProviderId): VideoProvider | null {
  return providers[id] || null
}

/**
 * Ambil semua provider yang tersedia (punya API key)
 */
export function getAvailableProviders(): VideoProvider[] {
  return Object.values(providers).filter(p => p.isAvailable())
}

/**
 * Generate video menggunakan provider yang dipilih
 */
export async function generateVideo(
  providerId: VideoProviderId,
  request: VideoGenerateRequest
): Promise<VideoGenerateResponse> {
  const provider = getProvider(providerId)
  if (!provider) {
    return {
      success: false,
      error: `Provider '${providerId}' tidak ditemukan`,
      provider: providerId,
    }
  }

  if (!provider.isAvailable()) {
    return {
      success: false,
      error: `Provider '${providerId}' belum dikonfigurasi (API key tidak ada)`,
      provider: providerId,
    }
  }

  try {
    return await provider.generate(request)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return {
      success: false,
      error: `Gagal generate video: ${message}`,
      provider: providerId,
    }
  }
}

// ─── Provider List (untuk frontend) ─────────────────────────────────────────

export interface ProviderInfo {
  id: VideoProviderId
  name: string
  tier: 'budget' | 'standard' | 'premium'
  costPerSecond: number
  costEstimate10s: string // Display string
  costEstimate15s: string
  available: boolean
}

export function getProviderList(): ProviderInfo[] {
  return Object.values(providers).map(p => ({
    id: p.id,
    name: p.name,
    tier: p.tier,
    costPerSecond: p.costPerSecond,
    costEstimate10s: `$${(p.costPerSecond * 10).toFixed(2)}`,
    costEstimate15s: `$${(p.costPerSecond * 15).toFixed(2)}`,
    available: p.isAvailable(),
  }))
}
