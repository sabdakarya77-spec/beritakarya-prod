"""
download_weights.py
Download model weights Real-ESRGAN ke folder ./weights/

Jalankan sekali sebelum start service:
  python download_weights.py
"""

import os
import urllib.request
from pathlib import Path

WEIGHTS_DIR = Path("./weights")
WEIGHTS_DIR.mkdir(exist_ok=True)

MODELS = {
    "RealESRGAN_x4plus.pth": (
        "https://github.com/xinntao/Real-ESRGAN/releases/download/"
        "v0.1.0/RealESRGAN_x4plus.pth"
    ),
}


def download(name: str, url: str):
    dest = WEIGHTS_DIR / name
    if dest.exists():
        print(f"✅ {name} sudah ada, skip download.")
        return

    print(f"⬇️  Download {name}...")
    print(f"   URL: {url}")

    def progress(block_num, block_size, total_size):
        downloaded = block_num * block_size
        pct = min(downloaded / total_size * 100, 100) if total_size > 0 else 0
        mb = downloaded / (1024 * 1024)
        print(f"\r   {pct:.1f}% ({mb:.1f} MB)", end="", flush=True)

    urllib.request.urlretrieve(url, dest, reporthook=progress)
    print(f"\n✅ {name} berhasil didownload ke {dest}")


if __name__ == "__main__":
    print("=== Download Real-ESRGAN Model Weights ===\n")
    for name, url in MODELS.items():
        download(name, url)
    print("\nSemua model siap. Jalankan service dengan: uvicorn main:app")
