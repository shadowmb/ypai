import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeCount = searchParams.get('include_count') === 'true'

    const query = supabase
      .from('categories')
      .select('*')
      .order('name')

    const { data: categories, error } = await query

    if (error) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database query failed',
          message: error.message 
        },
        { status: 500 }
      )
    }

    // If requested, include business count for each category
    let enrichedCategories = categories
    if (includeCount && categories) {
      enrichedCategories = await Promise.all(
        categories.map(async (category) => {
          const { count } = await supabase
            .from('businesses')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id)

          return {
            ...category,
            business_count: count || 0
          }
        })
      )
    }

    const response = {
      success: true,
      data: enrichedCategories || [],
      total: categories?.length || 0
    }

    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
    }

    return NextResponse.json(response, { headers })

  } catch (error) {
    console.error('Categories API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
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