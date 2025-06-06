import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// AI query analysis helper
function analyzeQuery(query: string) {
  const locations = ['софия', 'пловдив', 'варна', 'бургас', 'стара загора', 'плевен', 'русе', 'габрово', 'велико търново', 'благоевград']
  const categories = {
    'ресторант': 'restaurants',
    'храна': 'restaurants', 
    'ядене': 'restaurants',
    'кафе': 'restaurants',
    'бар': 'restaurants',
    'технологии': 'technology',
    'it': 'technology',
    'компютри': 'technology',
    'софтуер': 'technology',
    'програмиране': 'technology',
    'здраве': 'healthcare',
    'лекар': 'healthcare',
    'болница': 'healthcare',
    'аптека': 'healthcare',
    'стоматолог': 'healthcare',
    'образование': 'education',
    'училище': 'education',
    'университет': 'education',
    'курс': 'education',
    'обучение': 'education',
    'консултантски': 'consulting',
    'консултация': 'consulting',
    'правни': 'legal',
    'адвокат': 'legal',
    'нотариус': 'legal'
  }
  
  const queryLower = query.toLowerCase()
  
  // Extract location
  const detectedLocation = locations.find(loc => queryLower.includes(loc))
  
  // Extract category
  let detectedCategory = null
  let detectedCategorySlug = null
  for (const [keyword, slug] of Object.entries(categories)) {
    if (queryLower.includes(keyword)) {
      detectedCategory = keyword
      detectedCategorySlug = slug
      break
    }
  }
  
  // Extract keywords
  const stopWords = ['в', 'на', 'за', 'най', 'добър', 'добра', 'добро', 'добри', 'търся', 'искам', 'намери', 'покажи', 'където']
  const words = queryLower.split(/\s+/).filter(word => 
    word.length > 2 && !stopWords.includes(word) && !locations.includes(word)
  )
  
  // Determine intent
  let intent = 'find_business'
  if (queryLower.includes('телефон') || queryLower.includes('контакт') || queryLower.includes('връзка')) {
    intent = 'get_contact'
  } else if (queryLower.includes('сравни') || queryLower.includes('кой е по-добър') || queryLower.includes('разлика')) {
    intent = 'compare_options'
  } else if (queryLower.includes('отзив') || queryLower.includes('мнение') || queryLower.includes('препоръка')) {
    intent = 'get_reviews'
  }
  
  return {
    intent,
    location: detectedLocation,
    category: detectedCategory,
    category_slug: detectedCategorySlug,
    keywords: words
  }
}

// Calculate relevance score
function calculateRelevance(business: any, analysis: any, query: string): number {
  let score = 0
  const queryLower = query.toLowerCase()
  const businessName = business.name?.toLowerCase() || ''
  const businessDesc = business.description?.toLowerCase() || ''
  
  // Exact name match
  if (businessName.includes(queryLower)) score += 0.8
  
  // Partial name match
  analysis.keywords.forEach((keyword: string) => {
    if (businessName.includes(keyword)) score += 0.3
    if (businessDesc.includes(keyword)) score += 0.2
  })
  
  // Category match
  if (analysis.category_slug && business.category_slug === analysis.category_slug) {
    score += 0.4
  }
  
  // Location match (simplified - would need geocoding for better matching)
  if (analysis.location && businessDesc.includes(analysis.location)) {
    score += 0.3
  }
  
  return Math.min(score, 1.0) // Cap at 1.0
}

// Generate match reasons
function getMatchReasons(business: any, analysis: any, query: string): string[] {
  const reasons = []
  const queryLower = query.toLowerCase()
  const businessName = business.name?.toLowerCase() || ''
  const businessDesc = business.description?.toLowerCase() || ''
  
  if (businessName.includes(queryLower)) {
    reasons.push('Exact name match')
  }
  
  if (analysis.category_slug && business.category_slug === analysis.category_slug) {
    reasons.push(`Category match: ${business.category}`)
  }
  
  if (analysis.location && businessDesc.includes(analysis.location)) {
    reasons.push(`Location match: ${analysis.location}`)
  }
  
  analysis.keywords.forEach((keyword: string) => {
    if (businessName.includes(keyword)) {
      reasons.push(`Keyword in name: ${keyword}`)
    } else if (businessDesc.includes(keyword)) {
      reasons.push(`Keyword in description: ${keyword}`)
    }
  })
  
  return reasons
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
    const intent = searchParams.get('intent')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    
    if (!query) {
      return NextResponse.json({ 
        error: 'Query parameter is required',
        example: '/api/ai/search?query=най-добрите ресторанти в София'
      }, { status: 400 })
    }
    
    // Analyze the query
    const analysis = analyzeQuery(query)
    if (intent) analysis.intent = intent
    
    // Build Supabase query - simplified version
    let supabaseQuery = supabase
      .from('businesses')
      .select(`
        *,
        categories (
          name,
          slug,
          icon
        )
      `)
    
    // Simple text search if keywords exist
    if (analysis.keywords.length > 0) {
      const firstKeyword = analysis.keywords[0]
      supabaseQuery = supabaseQuery.ilike('name', `%${firstKeyword}%`)
    }
    
    const { data: businesses, error } = await supabaseQuery.limit(limit * 2) // Get more for better filtering
    
    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 })
    }
    
    // Calculate relevance and add AI metadata
    const enhancedResults = (businesses || []).map(business => ({
      ...business,
      category: business.categories?.name,
      category_slug: business.categories?.slug, 
      category_icon: business.categories?.icon,
      relevance_score: calculateRelevance(business, analysis, query),
      match_reasons: getMatchReasons(business, analysis, query)
    }))
    .filter(business => business.relevance_score > 0.1) // Filter low relevance
    .sort((a, b) => b.relevance_score - a.relevance_score) // Sort by relevance
    .slice(0, limit) // Apply final limit
    
    const response = {
      results: enhancedResults,
      query_analysis: analysis,
      metadata: {
        total_found: enhancedResults.length,
        query_time: Date.now(),
        ai_enhanced: true,
        suggestions: enhancedResults.length === 0 ? [
          'Try broader search terms',
          'Check spelling',
          'Try searching by category only'
        ] : []
      }
    }
    
    return NextResponse.json(response, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'X-AI-Enhanced': 'true',
        'X-Query-Analysis': Buffer.from(JSON.stringify(analysis), 'utf8').toString('base64')
      }
    })
    
  } catch (error) {
    console.error('AI Search error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'AI search processing failed'
    }, { status: 500 })
  }
}

// Handle preflight requests for CORS
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