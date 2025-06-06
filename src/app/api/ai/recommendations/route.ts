import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Business similarity scoring
function calculateSimilarity(business1: any, business2: any): number {
  let similarity = 0
  
  // Same category = high similarity
  if (business1.category_slug === business2.category_slug) {
    similarity += 0.6
  }
  
  // Location proximity (simplified)
  const location1 = business1.address?.toLowerCase() || ''
  const location2 = business2.address?.toLowerCase() || ''
  const cities = ['софия', 'пловдив', 'варна', 'бургас']
  
  for (const city of cities) {
    if (location1.includes(city) && location2.includes(city)) {
      similarity += 0.3
      break
    }
  }
  
  // Description keyword overlap
  const desc1Words = (business1.description?.toLowerCase() || '').split(/\s+/)
  const desc2Words = (business2.description?.toLowerCase() || '').split(/\s+/)
  const commonWords = desc1Words.filter((word: string) => 
    word.length > 3 && desc2Words.includes(word)
  )
  similarity += Math.min(commonWords.length * 0.1, 0.3)
  
  return similarity
}

// Generate contextual recommendations
function generateRecommendations(targetBusiness: any, allBusinesses: any[], context: string) {
  const recommendations = []
  
  switch (context) {
    case 'similar':
      // Find businesses in same category or similar services
      const similar = allBusinesses
        .filter(b => b.id !== targetBusiness.id)
        .map(b => ({
          ...b,
          similarity_score: calculateSimilarity(targetBusiness, b),
          recommendation_reason: getSimilarityReason(targetBusiness, b)
        }))
        .filter(b => b.similarity_score > 0.3)
        .sort((a, b) => b.similarity_score - a.similarity_score)
        .slice(0, 5)
      
      recommendations.push(...similar)
      break
      
    case 'alternative':
      // Find alternatives in same category but different features
      const alternatives = allBusinesses
        .filter(b => 
          b.id !== targetBusiness.id && 
          b.category_slug === targetBusiness.category_slug
        )
        .map(b => ({
          ...b,
          similarity_score: 0.8,
          recommendation_reason: `Alternative ${targetBusiness.category} provider`
        }))
        .slice(0, 3)
      
      recommendations.push(...alternatives)
      break
      
    case 'complementary':
      // Find businesses that complement this one
      const complementary = getComplementaryBusinesses(targetBusiness, allBusinesses)
      recommendations.push(...complementary)
      break
      
    default:
      // Mixed recommendations
      const mixed = allBusinesses
        .filter(b => b.id !== targetBusiness.id)
        .sort(() => Math.random() - 0.5) // Random selection
        .slice(0, 5)
        .map(b => ({
          ...b,
          similarity_score: Math.random() * 0.8 + 0.2,
          recommendation_reason: 'Popular choice'
        }))
      
      recommendations.push(...mixed)
  }
  
  return recommendations
}

function getSimilarityReason(business1: any, business2: any): string {
  if (business1.category_slug === business2.category_slug) {
    return `Same category: ${business1.category}`
  }
  
  const location1 = business1.address?.toLowerCase() || ''
  const location2 = business2.address?.toLowerCase() || ''
  const cities = ['sofia', 'plovdiv', 'varna', 'burgas']
  
  for (const city of cities) {
    if (location1.includes(city) && location2.includes(city)) {
      return `Same location: ${city}`
    }
  }
  
  return 'Similar services'
}

function getComplementaryBusinesses(targetBusiness: any, allBusinesses: any[]) {
  const complements: { [key: string]: string[] } = {
    'restaurants': ['hotels', 'entertainment', 'transportation'],
    'hotels': ['restaurants', 'tourism', 'transportation'],
    'technology': ['consulting', 'education', 'finance'],
    'healthcare': ['pharmacy', 'wellness', 'insurance'],
    'education': ['technology', 'consulting', 'books'],
    'consulting': ['technology', 'finance', 'legal'],
    'legal': ['consulting', 'finance', 'real-estate'],
    'finance': ['legal', 'consulting', 'insurance']
  }
  
  const targetCategory = targetBusiness.category_slug
  const complementCategories = complements[targetCategory] || []
  
  return allBusinesses
    .filter(b => complementCategories.includes(b.category_slug))
    .slice(0, 3)
    .map(b => ({
      ...b,
      similarity_score: 0.7,
      recommendation_reason: `Complements ${targetBusiness.category} services`
    }))
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('business_id')
    const context = searchParams.get('context') || 'similar' // similar, alternative, complementary, mixed
    const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 10)
    
    // If no specific business, return trending/popular recommendations
    if (!businessId) {
      const { data: trendingBusinesses, error } = await supabase
        .from('businesses')
        .select(`
          *,
          categories (
            name,
            slug,
            icon
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) {
        return NextResponse.json({ error: 'Database query failed' }, { status: 500 })
      }
      
      const trending = (trendingBusinesses || []).map(business => ({
        ...business,
        category: business.categories?.name,
        category_slug: business.categories?.slug,
        category_icon: business.categories?.icon,
        recommendation_score: 0.9,
        recommendation_reason: 'Recently added - Trending',
        recommendation_type: 'trending'
      }))
      
      return NextResponse.json({
        recommendations: trending,
        context: 'trending',
        metadata: {
          total: trending.length,
          recommendation_type: 'trending',
          ai_generated: true
        }
      })
    }
    
    // Get target business
    const { data: targetBusiness, error: targetError } = await supabase
      .from('businesses')
      .select(`
        *,
        categories (
          name,
          slug, 
          icon
        )
      `)
      .eq('id', businessId)
      .single()
    
    if (targetError || !targetBusiness) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }
    
    // Get all businesses for comparison
    const { data: allBusinesses, error: allError } = await supabase
      .from('businesses')
      .select(`
        *,
        categories (
          name,
          slug,
          icon
        )
      `)
      .limit(100) // Limit for performance
    
    if (allError) {
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 })
    }
    
    // Flatten business data
    const flatBusinesses = (allBusinesses || []).map(business => ({
      ...business,
      category: business.categories?.name,
      category_slug: business.categories?.slug,
      category_icon: business.categories?.icon
    }))
    
    const flatTarget = {
      ...targetBusiness,
      category: targetBusiness.categories?.name,
      category_slug: targetBusiness.categories?.slug,
      category_icon: targetBusiness.categories?.icon
    }
    
    // Generate recommendations
    const recommendations = generateRecommendations(flatTarget, flatBusinesses, context)
    
    return NextResponse.json({
      recommendations: recommendations.slice(0, limit),
      target_business: flatTarget,
      context,
      metadata: {
        total_found: recommendations.length,
        context_used: context,
        ai_generated: true,
        generation_time: Date.now()
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-AI-Recommendations': 'true',
        'X-Recommendation-Context': context
      }
    })
    
  } catch (error) {
    console.error('AI Recommendations error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'AI recommendations processing failed'
    }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}