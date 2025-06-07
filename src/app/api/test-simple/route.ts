// src/app/api/test-simple/route.ts - Най-простото възможно API за тестване
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    console.log('🧪 Ultra Simple API Test Started');
    
    const body = await req.json();
    console.log('📨 Request body:', body);
    
    // Проверка на Supabase връзката
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('id, name, description, embedding')
      .limit(3);

    if (error) {
      console.error('❌ Supabase error:', error);
      throw error;
    }

    console.log('📊 Businesses found:', businesses?.length);
    
    if (businesses && businesses.length > 0) {
      businesses.forEach((business, index) => {
        console.log(`${index + 1}. ${business.name}`);
        console.log(`   Has embedding: ${!!business.embedding}`);
        console.log(`   Embedding type: ${typeof business.embedding}`);
        console.log(`   Embedding length: ${business.embedding?.length || 'N/A'}`);
        if (business.embedding && Array.isArray(business.embedding)) {
          console.log(`   First 3 values: [${business.embedding.slice(0, 3).join(', ')}]`);
        }
      });
    }

    return NextResponse.json({
      message: 'Ultra simple test completed',
      businesses_count: businesses?.length || 0,
      businesses: businesses?.map(b => ({
        id: b.id,
        name: b.name,
        has_embedding: !!b.embedding,
        embedding_length: b.embedding?.length || 0
      })) || []
    });

  } catch (error: any) {
    console.error('💥 Ultra Simple API Error:', error);
    
    return NextResponse.json({ 
      error: error.message || 'Unknown error',
      details: error.toString()
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Ultra Simple Test API',
    usage: 'POST with any JSON body'
  });
}