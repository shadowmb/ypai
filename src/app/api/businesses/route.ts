import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/businesses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const category = searchParams.get('category')
    const location = searchParams.get('location')
    const verified = searchParams.get('verified')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search')

    // Build query
    let query = supabase
      .from('businesses')
      .select(`
        id,
        name,
        description,
        address,
        city,
        phone,
        email,
        website,
        verified,
        rating,
        review_count,
        created_at,
        categories (
          id,
          name,
          slug,
          icon
        )
      `)

    // Apply filters
    if (category) {
      if (isNaN(Number(category))) {
        // If category is slug (e.g., 'restaurants')
        query = query.eq('categories.slug', category)
      } else {
        // If category is ID
        query = query.eq('category_id', parseInt(category))
      }
    }

    if (location) {
      query = query.ilike('city', `%${location}%`)
    }

    if (verified === 'true') {
      query = query.eq('verified', true)
    } else if (verified === 'false') {
      query = query.eq('verified', false)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,city.ilike.%${search}%`)
    }

    // Apply pagination and ordering
    query = query
      .order('verified', { ascending: false })
      .order('rating', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: businesses, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database query failed',
          message: error.message 
        },
        { status: 500 }
      )
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('businesses')
      .select('*', { count: 'exact', head: true })

    // Format response for AI consumption
    const response = {
      success: true,
      data: businesses?.map(business => ({
        id: business.id,
        name: business.name,
        description: business.description,
        category: business.categories?.name,
        category_slug: business.categories?.slug,
        category_icon: business.categories?.icon,
        address: business.address,
        city: business.city,
        phone: business.phone,
        email: business.email,
        website: business.website,
        verified: business.verified,
        rating: business.rating,
        review_count: business.review_count,
        created_at: business.created_at
      })) || [],
      pagination: {
        total: totalCount || 0,
        limit,
        offset,
        has_more: (offset + limit) < (totalCount || 0)
      },
      query_info: {
        filters_applied: {
          category: category || null,
          location: location || null,
          verified: verified || null,
          search: search || null
        },
        execution_time: Date.now()
      }
    }

    // Add CORS headers for AI agents
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60' // Cache for 1 minute
    }

    return NextResponse.json(response, { headers })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: 'An unexpected error occurred'
      },
      { status: 500 }
    )
  }
}

// POST /api/businesses (for adding new businesses via API)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ['name', 'category_id']
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          missing_fields: missingFields
        },
        { status: 400 }
      )
    }

    // Insert business
    const { data, error } = await supabase
      .from('businesses')
      .insert([{
        name: body.name,
        description: body.description || null,
        category_id: parseInt(body.category_id),
        address: body.address || null,
        city: body.city || null,
        phone: body.phone || null,
        email: body.email || null,
        website: body.website || null,
        verified: body.verified || false,
        rating: 0,
        review_count: 0
      }])
      .select(`
        *,
        categories (
          id,
          name,
          slug,
          icon
        )
      `)

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create business',
          message: error.message
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: data?.[0] || null,
        message: 'Business created successfully'
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('API POST error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to parse request body'
      },
      { status: 500 }
    )
  }
}

// OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}