// src/types/index.ts - Обновени типове с GPS координати

export interface Business {
  id: number;
  name: string;
  description: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  website: string;
  category_id: number;
  category: { id?: number; name: string; icon: string } | null;
  verified: boolean;
  rating: number;
  review_count: number;
  working_hours: string;
  custom_fields: any;
  created_at: string;
  updated_at: string;
  // НОВИ ПОЛЕТА ЗА GPS
  latitude?: number | null;
  longitude?: number | null;
}

export interface AISearchResult {
  id: number;
  name: string;
  description: string;
  address: string;
  city: string;
  phone?: string;
  email?: string;
  website?: string;
  category_id: number;
  working_hours?: string;
  custom_fields?: Record<string, any>;
  verified: boolean;
  rating?: number;
  review_count: number;
  category?: {
    id: number;
    name: string;
    icon: string;
  } | null;
  similarity_percentage: number;
  similarity?: number;
  // НОВИ ПОЛЕТА ЗА GPS
  latitude?: number | null;
  longitude?: number | null;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
  slug: string;
}