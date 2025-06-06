// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Updated type definitions
export interface Business {
  id: number
  name: string
  description: string | null
  address: string | null
  city: string | null
  phone: string | null
  email: string | null
  website: string | null
  category_id: number
  rating: number
  review_count: number
  verified: boolean
  working_hours: string | null
  custom_fields: Record<string, any> // New JSON field
  created_at: string
  updated_at: string | null
  categories?: Category
}

export interface Category {
  id: number
  name: string
  slug: string
  icon: string
  description: string | null
  created_at: string
}

export interface APIKey {
  id: number
  name: string
  key_hash: string
  created_at: string
  last_used_at: string | null
  is_active: boolean
}

// New interface for business creation with templates
export interface BusinessInput {
  name: string
  description?: string
  address?: string
  city?: string
  phone?: string
  email?: string
  website?: string
  category_id: number
  working_hours?: string
  custom_fields?: Record<string, any>
  verified?: boolean
}