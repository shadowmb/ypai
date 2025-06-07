// src/types/index.ts - Общи типове за целия проект

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
    created_at: string; // Направено задължително
    updated_at: string; // Направено задължително
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
  }
  
  export interface Category {
    id: number;
    name: string;
    icon: string;
    slug: string;
  }