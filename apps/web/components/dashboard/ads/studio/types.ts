export interface AdPackage {
  id: string;
  name: string;
  slot: string;
  durationDays: number;
  price: number | string;
  description: string | null;
  isActive: boolean;
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
  // Creative
  adFile: File | null;
  adFileName: string;
  adPreviewUrl: string;
  // Multi-size IAB (leaderboard)
  adFileTablet: File | null;
  adFileNameTablet: string;
  adPreviewUrlTablet: string;
  adFileMobile: File | null;
  adFileNameMobile: string;
  adPreviewUrlMobile: string;
  // Animation
  animationEffect: string;
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
