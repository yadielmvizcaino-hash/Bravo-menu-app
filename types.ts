
export enum PlanType {
  FREE = 'FREE',
  PRO = 'PRO'
}

export enum BusinessType {
  RESTAURANT = 'Restaurante',
  BAR = 'Bar',
  CAFETERIA = 'Cafetería',
  ICE_CREAM = 'Heladería'
}

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  categoryId: string;
  isHighlighted?: boolean;
  isVisible?: boolean;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  dateTime: string;
  imageUrl: string;
  price?: number;
  interestedCount: number;
}

export interface Banner {
  id: string;
  imageUrl: string;
  linkUrl: string;
  position: 'header' | 'middle' | 'footer';
  clicks: number;
  title?: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  date: string;
}

export interface Business {
  id: string;
  name: string;
  description: string;
  type: BusinessType;
  province: string;
  municipality: string;
  address: string;
  phone: string;
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  email?: string;
  logoUrl: string;
  coverPhotos: string[];
  plan: PlanType;
  planExpiresAt?: string | null;
  categories: Category[];
  products: Product[];
  events: Event[];
  banners: Banner[];
  leads: Lead[];
  stats: {
    visits: number;
    qrScans: number;
    uniqueVisitors: number;
  };
  averageRating?: number;
  ratingsCount?: number;
  cuisineTypes?: string[];
  schedule?: Record<string, { open: boolean; from: string; to: string }>;
  deliveryEnabled?: boolean;
  deliveryPriceInside?: number;
  deliveryPriceOutside?: number;
  role?: 'admin' | 'user';
  isVisible?: boolean;
}
