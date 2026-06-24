export interface Ad {
  id: string;
  slot: string;
  code: string | null;
  imageUrl: string | null;
  imageUrlTablet?: string | null;
  imageUrlMobile?: string | null;
  linkUrl: string | null;
  isActive: boolean;
  order?: number;
  impressions?: number;
  clicks?: number;
}

export interface AdPackage {
  id: string;
  name: string;
  slot: string;
  allowedFormat: string;
  durationDays: number;
  price: string;
  description: string | null;
  isActive: boolean;
}

export interface AdBooking {
  id: string;
  userId: string;
  siteId: string;
  packageId: string;
  imageUrl: string | null;
  imageUrlTablet?: string | null;
  imageUrlMobile?: string | null;
  linkUrl: string | null;
  startDate: string;
  endDate: string;
  paymentStatus: 'PENDING' | 'VERIFYING' | 'PAID' | 'REJECTED';
  paymentProof: string | null;
  status: 'PENDING_REVIEW' | 'ACTIVE' | 'COMPLETED' | 'REJECTED';
  rejectionNotes: string | null;
  impressions: number;
  clicks: number;
  createdAt: string;
  package: AdPackage;
  site: { name: string; domain: string };
  user?: { name: string; email: string };
}
