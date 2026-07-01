export interface AdPackage {
  id: string;
  name: string;
  slot: string;
  durationDays: number;
  price: string; // Prisma Decimal serializes as string
  allowedFormat: string; // 'IMAGE' | 'VIDEO' | 'ALL'
  description: string | null;
  isActive: boolean;
}

export interface ProcessedVariant {
  url: string;
  width: number;
  height: number;
  method: string;
  dominantColor: string;
}

export interface CrossSlotPreview {
  slot: string;
  variant?: string;
  url: string;
  width: number;
  height: number;
  method: string;
  dominantColor: string;
}

export interface StudioData {
  // Package
  selectedPackage: AdPackage | null;
  mediaType: 'image' | 'video';
  // Campaign
  campaignName: string;
  linkUrl: string;
  startDate: string;
  endDate: string;
  // Creative — single file upload
  adFile: File | null;
  adFileName: string;
  adPreviewUrl: string;
  // Creative — HOME_TOP logo upload
  logoFile: File | null;
  logoFileName: string;
  logoPreviewUrl: string;
  // Server-processed variants (hasil dari /upload-ad)
  processedVariants: {
    desktop: ProcessedVariant | null;
    tablet: ProcessedVariant | null;
    mobile: ProcessedVariant | null;
  } | null;
  processingWarnings: string[];
  isProcessing: boolean;
  // Cross-slot previews (hasil dari /ad-preview — how image looks in OTHER slots)
  crossSlotPreviews: CrossSlotPreview[] | null;
  isLoadingCrossPreviews: boolean;
  // Payment
  receiptFile: File | null;
  receiptFileName: string;
  receiptPreviewUrl: string;
}

export type SectionId = 'package' | 'campaign' | 'creative' | 'payment';

export interface SectionState {
  id: SectionId;
  label: string;
  step: number;
  isComplete: boolean;
  isActive: boolean;
}
