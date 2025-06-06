import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types за TypeScript
export type Business = {
  id: number
  name: string
  description: string | null
  category_id: number
  address: string | null
  city: string | null
  phone: string | null
  email: string | null
  website: string | null
  verified: boolean
  rating: number
  review_count: number
  created_at: string
  categories?: Category
}

export type Category = {
  id: number
  name: string
  slug: string
  icon: string | null
  description: string | null
}