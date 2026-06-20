import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl as getS3SignedUrl } from '@aws-sdk/s3-request-presigner'
import fs from 'fs/promises'
import { logger } from '../lib/logger'
import { AppError } from '../utils/AppError'

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || 'ap-southeast-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
  },
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
})

// Client khusus untuk generate presigned URL.
// Menggunakan S3_PUBLIC_ENDPOINT sebagai endpoint agar tanda tangan (Signature)
// dihitung berdasarkan Host header yang akan dikirimkan browser (mencegah SignatureDoesNotMatch).
const s3Sign = process.env.S3_PUBLIC_ENDPOINT
  ? new S3Client({
      endpoint: process.env.S3_PUBLIC_ENDPOINT,
      region: process.env.S3_REGION || 'ap-southeast-1',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || '',
        secretAccessKey: process.env.S3_SECRET_KEY || '',
      },
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    })
  : s3

/**
 * Replace internal MinIO hostname with a public-accessible URL.
 * Needed when S3_ENDPOINT is an internal IP (e.g. http://10.0.0.11:9000)
 * but browsers need to access via a public domain (e.g. https://minio.beritakarya.co).
 * Set S3_PUBLIC_ENDPOINT in .env to enable this rewrite.
 */
function rewritePresignedUrl(url: string): string {
  const publicEndpoint = process.env.S3_PUBLIC_ENDPOINT
  const internalEndpoint = process.env.S3_ENDPOINT
  if (publicEndpoint && internalEndpoint && url.startsWith(internalEndpoint)) {
    return url.replace(internalEndpoint, publicEndpoint.replace(/\/$/, ''))
  }
  return url
}

const KYC_BUCKET = process.env.S3_BUCKET || 'kyc'
const MEDIA_BUCKET = process.env.S3_MEDIA_BUCKET || 'media'

// Base URL for public media access.
// Self-hosted: https://media.beritakarya.co (MinIO via Caddy)
// Supabase:   https://<ref>.supabase.co/storage/v1/object/public
let resolvedPublicUrl = process.env.SUPABASE_STORAGE_PUBLIC_URL || ''
if (!resolvedPublicUrl && process.env.S3_ENDPOINT) {
  const match = process.env.S3_ENDPOINT.match(/https:\/\/([^.]+)\.storage\.supabase\.co/)
  if (match && match[1]) {
    resolvedPublicUrl = `https://${match[1]}.supabase.co/storage/v1/object/public`
  }
}
const SUPABASE_STORAGE_PUBLIC_URL = resolvedPublicUrl

export class StorageService {
  /**
   * Upload from a local file path to S3 (legacy — used by migration scripts).
   * Prefer uploadBuffer() in serverless contexts.
   */
  static async uploadFile(
    localPath: string,
    remoteKey: string,
    contentType: string,
    bucket: string = KYC_BUCKET
  ): Promise<string> {
    const fileBuffer = await fs.readFile(localPath)
    return StorageService.uploadBuffer(fileBuffer, remoteKey, contentType, bucket)
  }

  /**
   * Upload directly from a Buffer — serverless-safe, no filesystem writes.
   */
  static async uploadBuffer(
    buffer: Buffer,
    remoteKey: string,
    contentType: string,
    bucket: string = KYC_BUCKET,
    options: { isPublic?: boolean } = {}
  ): Promise<string> {
    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: remoteKey,
          Body: buffer,
          ContentType: contentType,
          ACL: options.isPublic ? 'public-read' : 'private',
        })
      )
      logger.info(`[Storage] Uploaded to ${bucket}/${remoteKey}`)
      return remoteKey
    } catch (error: unknown) {
      logger.error(`[Storage] uploadBuffer failed for ${bucket}/${remoteKey}:`, error)
      const message = error instanceof Error ? error.message : 'Unknown storage error'
      throw new AppError(`Gagal mengunggah ke storage: ${message}`, 500, 'STORAGE_UPLOAD_FAILED')
    }
  }

  /**
   * Build a public CDN URL for files in a public Supabase Storage bucket.
   * Pattern: <SUPABASE_STORAGE_PUBLIC_URL>/<bucket>/<key>
   */
  static getPublicUrl(bucket: string, key: string): string {
    if (!SUPABASE_STORAGE_PUBLIC_URL) {
      throw new AppError('Konfigurasi CDN tidak ditemukan. Hubungi administrator.', 500, 'STORAGE_CONFIG_MISSING')
    }
    const base = SUPABASE_STORAGE_PUBLIC_URL.replace(/\/$/, '')
    return `${base}/${bucket}/${key}`
  }

  /**
   * Generate a short-lived signed URL for private file access (e.g. KYC docs).
   */
  static async getSignedUrl(
    key: string,
    expiresSeconds: number = 3600,
    bucket: string = KYC_BUCKET
  ): Promise<string> {
    try {
      const url = await getS3SignedUrl(
        s3Sign,
        new GetObjectCommand({ Bucket: bucket, Key: key }),
        { expiresIn: expiresSeconds }
      )
      return process.env.S3_PUBLIC_ENDPOINT ? url : rewritePresignedUrl(url)
    } catch (error) {
      logger.error(`[Storage] getSignedUrl failed for ${bucket}/${key}:`, error)
      throw error
    }
  }

  /**
   * Delete a file from a bucket.
   */
  static async deleteFile(key: string, bucket: string = KYC_BUCKET): Promise<void> {
    try {
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
      logger.info(`[Storage] Deleted ${bucket}/${key}`)
    } catch (error) {
      logger.error(`[Storage] deleteFile failed for ${bucket}/${key}:`, error)
    }
  }

  // Convenience accessors for bucket names
  static get kycBucket() { return KYC_BUCKET }
  static get mediaBucket() { return MEDIA_BUCKET }
}
