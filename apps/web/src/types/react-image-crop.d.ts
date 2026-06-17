declare module 'react-image-crop' {
  export interface Crop {
    x: number;
    y: number;
    width: number;
    height: number;
    unit?: 'px' | '%';
  }
  export interface PixelCrop extends Crop {
    unit: 'px';
  }
  export function centerCrop(crop: Crop, width: number, height: number): Crop;
  export function makeAspectCrop(crop: Crop, aspect: number, width: number, height: number): Crop;
  const ReactCrop: React.FC<{
    crop?: Crop;
    onChange: (crop: Crop, pixelCrop: PixelCrop) => void;
    onComplete?: (crop: Crop, pixelCrop: PixelCrop) => void;
    children?: React.ReactNode;
    [key: string]: unknown;
  }>;
  export default ReactCrop;
}
