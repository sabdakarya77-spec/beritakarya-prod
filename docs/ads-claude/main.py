"""
Real-ESRGAN Upscale Microservice — BeritaKarya
FastAPI service yang menerima gambar, upscale dengan Real-ESRGAN, return hasilnya.

Endpoint:
  POST /upscale  — upload gambar, return gambar hasil upscale (WebP)
  GET  /health   — health check + status model
"""

import io
import os
import time
import logging
import traceback
from pathlib import Path
from typing import Optional

import cv2
import numpy as np
from PIL import Image
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.responses import Response, JSONResponse
from basicsr.archs.rrdbnet_arch import RRDBNet
from realesrgan import RealESRGANer

# ─── Logging ────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

# ─── Konfigurasi ─────────────────────────────────────────────────────────────
MODEL_PATH = os.getenv("MODEL_PATH", "./weights/RealESRGAN_x4plus.pth")
DEVICE     = os.getenv("DEVICE", "cpu")          # 'cpu' atau 'cuda'
MAX_FILE_MB = int(os.getenv("MAX_FILE_MB", "20"))
OUTPUT_QUALITY = int(os.getenv("OUTPUT_QUALITY", "90"))  # WebP quality

# ─── App ─────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="BeritaKarya Upscale Service",
    description="Real-ESRGAN image upscaling microservice",
    version="1.0.0",
)

# ─── Load model sekali saat startup ──────────────────────────────────────────
upsampler: Optional[RealESRGANer] = None
model_loaded = False
model_error: Optional[str] = None

@app.on_event("startup")
async def load_model():
    global upsampler, model_loaded, model_error

    logger.info(f"Loading Real-ESRGAN model dari: {MODEL_PATH}")
    logger.info(f"Device: {DEVICE}")

    try:
        if not Path(MODEL_PATH).exists():
            raise FileNotFoundError(
                f"Model weights tidak ditemukan di {MODEL_PATH}. "
                "Jalankan: python download_weights.py"
            )

        model = RRDBNet(
            num_in_ch=3,
            num_out_ch=3,
            num_feat=64,
            num_block=23,
            num_grow_ch=32,
            scale=4,
        )

        upsampler = RealESRGANer(
            scale=4,
            model_path=MODEL_PATH,
            model=model,
            tile=512,           # tile processing — hemat VRAM/RAM
            tile_pad=10,
            pre_pad=0,
            half=(DEVICE == "cuda"),  # FP16 hanya di GPU
            device=DEVICE,
        )

        model_loaded = True
        logger.info("✅ Model Real-ESRGAN berhasil dimuat")

    except Exception as e:
        model_error = str(e)
        logger.error(f"❌ Gagal load model: {e}")


# ─── Helper ──────────────────────────────────────────────────────────────────

def read_image_from_bytes(data: bytes) -> np.ndarray:
    """Decode bytes gambar ke numpy array BGR (format OpenCV)."""
    arr = np.frombuffer(data, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Tidak dapat membaca gambar. Pastikan format JPG/PNG/WebP.")
    return img


def numpy_to_webp_bytes(img_bgr: np.ndarray, quality: int = 90) -> bytes:
    """Konversi numpy array BGR ke bytes WebP."""
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    pil_img = Image.fromarray(img_rgb)
    buf = io.BytesIO()
    pil_img.save(buf, format="WEBP", quality=quality, method=6)
    return buf.getvalue()


def clamp_scale(scale: int) -> int:
    """Pastikan scale hanya 2 atau 4."""
    return 4 if scale not in (2, 4) else scale


# ─── Endpoints ───────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    """Health check — cek apakah model sudah siap."""
    if model_loaded:
        return {
            "status": "ok",
            "model": "Real-ESRGAN x4plus",
            "device": DEVICE,
            "ready": True,
        }
    else:
        return JSONResponse(
            status_code=503,
            content={
                "status": "error",
                "ready": False,
                "error": model_error or "Model belum dimuat",
            },
        )


@app.post("/upscale")
async def upscale(
    file: UploadFile = File(..., description="Gambar yang akan di-upscale (JPG/PNG/WebP)"),
    scale: int = Form(4, description="Faktor upscale: 2 atau 4"),
):
    """
    Upscale gambar menggunakan Real-ESRGAN.

    - **file**: Gambar input (JPG, PNG, WebP). Max 20 MB.
    - **scale**: 2 = 2× ukuran, 4 = 4× ukuran (default).

    Return: Gambar WebP hasil upscale.
    """
    # Validasi model
    if not model_loaded:
        raise HTTPException(
            status_code=503,
            detail=f"Model belum siap: {model_error or 'loading...'}",
        )

    # Validasi format file
    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    content_type = file.content_type or ""
    if content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Format tidak didukung: {content_type}. Gunakan JPG, PNG, atau WebP.",
        )

    # Baca dan validasi ukuran file
    raw = await file.read()
    size_mb = len(raw) / (1024 * 1024)
    if size_mb > MAX_FILE_MB:
        raise HTTPException(
            status_code=413,
            detail=f"File terlalu besar ({size_mb:.1f} MB). Maksimal {MAX_FILE_MB} MB.",
        )

    scale = clamp_scale(scale)

    logger.info(
        f"Upscale request — file: {file.filename}, "
        f"size: {size_mb:.2f} MB, scale: {scale}x"
    )

    t_start = time.time()

    try:
        # Decode gambar
        img = read_image_from_bytes(raw)
        h_in, w_in = img.shape[:2]
        logger.info(f"Dimensi input: {w_in}×{h_in}")

        # Jalankan Real-ESRGAN
        output, _ = upsampler.enhance(img, outscale=scale)

        h_out, w_out = output.shape[:2]
        elapsed = time.time() - t_start

        logger.info(
            f"✅ Selesai — output: {w_out}×{h_out}, "
            f"waktu: {elapsed:.2f}s"
        )

        # Encode ke WebP
        result_bytes = numpy_to_webp_bytes(output, quality=OUTPUT_QUALITY)

        return Response(
            content=result_bytes,
            media_type="image/webp",
            headers={
                "X-Input-Width":   str(w_in),
                "X-Input-Height":  str(h_in),
                "X-Output-Width":  str(w_out),
                "X-Output-Height": str(h_out),
                "X-Scale":         str(scale),
                "X-Process-Time":  f"{elapsed:.2f}s",
            },
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saat upscale: {e}\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Gagal memproses gambar: {str(e)}",
        )
