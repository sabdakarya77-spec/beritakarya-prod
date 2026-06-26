/**
 * upscale.service.ts
 * apps/api/src/lib/upscale.service.ts
 *
 * Service NestJS untuk memanggil Real-ESRGAN Upscale Microservice.
 * Dipanggil dari ad-image-processor.ts sebelum pipeline resize.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import FormData from 'form-data';
import axios, { AxiosError } from 'axios';

export interface UpscaleResult {
  buffer: Buffer;
  inputWidth: number;
  inputHeight: number;
  outputWidth: number;
  outputHeight: number;
  scale: number;
  processingTime: string;
}

@Injectable()
export class UpscaleService {
  private readonly logger = new Logger(UpscaleService.name);
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = config.get<string>(
      'UPSCALE_SERVICE_URL',
      'http://upscale-service:8001',   // default: nama service Docker
    );
    this.timeoutMs = config.get<number>('UPSCALE_TIMEOUT_MS', 60_000); // 60 detik
  }

  /**
   * Cek apakah upscale service sedang berjalan dan model sudah siap.
   */
  async isReady(): Promise<boolean> {
    try {
      const res = await axios.get(`${this.baseUrl}/health`, {
        timeout: 5_000,
      });
      return res.data?.ready === true;
    } catch {
      return false;
    }
  }

  /**
   * Upscale gambar menggunakan Real-ESRGAN.
   *
   * @param imageBuffer  Buffer gambar input (JPG/PNG/WebP)
   * @param scale        Faktor upscale: 2 atau 4 (default: 4)
   * @returns            UpscaleResult dengan buffer WebP hasil upscale
   * @throws             Error jika service tidak tersedia atau proses gagal
   */
  async upscale(imageBuffer: Buffer, scale: 2 | 4 = 4): Promise<UpscaleResult> {
    const serviceReady = await this.isReady();
    if (!serviceReady) {
      throw new Error('Upscale service tidak tersedia');
    }

    // Buat multipart form data
    const form = new FormData();
    form.append('file', imageBuffer, {
      filename: 'image.jpg',
      contentType: 'image/jpeg',
    });
    form.append('scale', scale.toString());

    this.logger.debug(
      `Upscale request — buffer: ${(imageBuffer.length / 1024).toFixed(1)} KB, scale: ${scale}x`,
    );

    const t = Date.now();

    const response = await axios.post<Buffer>(`${this.baseUrl}/upscale`, form, {
      headers: form.getHeaders(),
      responseType: 'arraybuffer',
      timeout: this.timeoutMs,
      maxContentLength: 100 * 1024 * 1024, // 100 MB max response
    });

    const elapsed = ((Date.now() - t) / 1000).toFixed(2);

    const headers = response.headers as Record<string, string>;

    const result: UpscaleResult = {
      buffer: Buffer.from(response.data),
      inputWidth:    parseInt(headers['x-input-width']  ?? '0', 10),
      inputHeight:   parseInt(headers['x-input-height'] ?? '0', 10),
      outputWidth:   parseInt(headers['x-output-width'] ?? '0', 10),
      outputHeight:  parseInt(headers['x-output-height']?? '0', 10),
      scale,
      processingTime: `${elapsed}s`,
    };

    this.logger.log(
      `✅ Upscale selesai — ` +
      `${result.inputWidth}×${result.inputHeight} → ` +
      `${result.outputWidth}×${result.outputHeight} ` +
      `(${result.processingTime})`,
    );

    return result;
  }

  /**
   * Upscale dengan fallback otomatis.
   * Jika service tidak tersedia atau gagal, return buffer asli tanpa upscale.
   *
   * Dipakai di pipeline produksi agar proses iklan tidak pernah macet
   * hanya karena upscale service down.
   */
  async upscaleWithFallback(
    imageBuffer: Buffer,
    scale: 2 | 4 = 4,
  ): Promise<{ buffer: Buffer; wasUpscaled: boolean }> {
    try {
      const result = await this.upscale(imageBuffer, scale);
      return { buffer: result.buffer, wasUpscaled: true };
    } catch (err) {
      const msg = err instanceof AxiosError
        ? `HTTP ${err.response?.status ?? 'timeout'}`
        : String(err);

      this.logger.warn(
        `⚠️  Upscale gagal (${msg}), lanjut tanpa upscale`,
      );

      return { buffer: imageBuffer, wasUpscaled: false };
    }
  }
}
