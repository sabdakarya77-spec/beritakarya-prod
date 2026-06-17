'use client';

import { useState, useRef, useCallback } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X, Check, ZoomIn } from 'lucide-react';

interface AdImageCropperProps {
  file: File;
  aspectRatio: number; // width / height, e.g. 970/250 = 3.88
  onComplete: (blob: Blob) => void;
  onCancel: () => void;
}

export default function AdImageCropper({ file, aspectRatio, onComplete, onCancel }: AdImageCropperProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);
  const [scale, setScale] = useState(1);
  const [imgSrc, setImgSrc] = useState('');
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Read file as data URL on mount
  useState(() => {
    const reader = new FileReader();
    reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
    reader.readAsDataURL(file);
  });

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop({ x: 0, y: 0, unit: '%', width: 90, height: 90 }, aspectRatio, width, height),
      width,
      height
    );
    setCrop(crop);
    setCompletedCrop(crop);
  }, [aspectRatio]);

  const generateCroppedImage = useCallback(() => {
    const image = imgRef.current;
    const canvas = canvasRef.current;
    if (!image || !canvas || !completedCrop) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pixelCrop = {
      x: (completedCrop.x / 100) * image.naturalWidth,
      y: (completedCrop.y / 100) * image.naturalHeight,
      width: (completedCrop.width / 100) * image.naturalWidth,
      height: (completedCrop.height / 100) * image.naturalHeight,
    };

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    canvas.toBlob(
      (blob) => {
        if (blob) onComplete(blob);
      },
      'image/webp',
      0.9
    );
  }, [completedCrop, onComplete]);

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-white/10 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/5">
          <div>
            <h3 className="text-sm font-black text-brand-black dark:text-white uppercase tracking-tight">Sesuaikan Area Gambar</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">Seret untuk mengatur posisi gambar yang ditampilkan</p>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Crop Area */}
        <div className="flex-1 overflow-auto p-5">
          {imgSrc && (
            <div className="flex justify-center">
              <ReactCrop
                crop={crop}
                onChange={(_pixelCrop: Crop, percentCrop: Crop) => setCrop(percentCrop)}
                onComplete={(_pixelCrop: Crop, percentCrop: Crop) => setCompletedCrop(percentCrop)}
                aspect={aspectRatio}
                minWidth={50}
              >
                <img
                  ref={imgRef}
                  src={imgSrc}
                  alt="Crop preview"
                  style={{ transform: `scale(${scale})`, maxHeight: '400px' }}
                  className="max-w-full object-contain"
                  onLoad={onImageLoad}
                />
              </ReactCrop>
            </div>
          )}
        </div>

        {/* Zoom Slider */}
        <div className="px-5 py-3 border-t border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <ZoomIn size={14} className="text-gray-400" />
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="flex-1 accent-brand-red"
            />
            <span className="text-[10px] font-mono text-gray-400 w-10 text-right">{Math.round(scale * 100)}%</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 bg-gray-100 dark:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-700 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={generateCroppedImage}
            className="px-6 py-2.5 bg-brand-red text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-red/20 hover:opacity-90 transition-all flex items-center gap-2"
          >
            <Check size={14} /> Gunakan Gambar
          </button>
        </div>
      </div>

      {/* Hidden canvas for cropping */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
