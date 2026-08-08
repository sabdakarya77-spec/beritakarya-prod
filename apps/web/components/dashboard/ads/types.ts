export interface Ad {
  id: string;
  slot: string;
  imageUrl: string | null;
  linkUrl: string | null;
  isActive: boolean;
  order?: number;
  impressions?: number;
  clicks?: number;
  createdAt?: string;
}