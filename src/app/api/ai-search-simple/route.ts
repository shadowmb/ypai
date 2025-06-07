// src/app/api/ai-search-simple/route.ts - Опростена версия за тестване
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { pipeline } from '@xenova/transformers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

let pipelineInstance: any = null;

async function getPipeline() {
  if (!pipelineInstance) {
    pipelineInstance = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return pipelineInstance;
}

export async function POST(req: NextRequest) {
  let requestQuery = 'unknown';
  
  try {
    const body = await req.json();
    const { query, threshold = 0.5, limit = 5 } = body;
    requestQuery = query || 'unknown';
    
    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    console.log(`🔍 Simple AI Search Query: "${query}"`);
    
    // 1. Генерирай embedding
    const pipe = await getPipeline();
    const output = await pipe(query, { pooling: 'mean', normalize: true });
    const query_embedding = Array.from(output.data);

    console.log(`📊 Generated embedding with ${query_embedding.length} dimensions`);

    // 2. Опростена SQL заявка - ръчно построена
    const { data: businesses, error } = await supabase
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
        category_id,
        working_hours,
        custom_fields,
        verified,
        rating,
        review_count,
        embedding
      `)
      .not('embedding', 'is', null);

    if (error) {
      console.error('🚫 Supabase Query Error:', error);
      throw error;
    }

    console.log(`📋 Found ${businesses?.length || 0} businesses with embeddings`);

    if (!businesses || businesses.length === 0) {
      return NextResponse.json({
        query: query,
        results: [],
        total: 0,
        message: 'Няма бизнеси с embeddings в базата данни'
      });
    }

    // Логиране на първия бизнес за debug
    console.log(`🔍 Sample business:`, {
      name: businesses[0]?.name,
      hasEmbedding: !!businesses[0]?.embedding,
      embeddingType: typeof businesses[0]?.embedding,
      embeddingLength: businesses[0]?.embedding?.length,
      embeddingSample: businesses[0]?.embedding?.slice(0, 5)
    });

    // 3. Изчисли similarity ръчно (поправен алгоритъм с правилни типове)
    console.log(`🧠 Query embedding sample:`, query_embedding.slice(0, 5));
    
    const results = businesses
      .map((business: any, index: number) => {
        console.log(`\n🔄 Processing business ${index + 1}/${businesses.length}: ${business.name}`);
        
        if (!business.embedding || !Array.isArray(business.embedding)) {
          console.log(`❌ Invalid embedding for ${business.name}:`, {
            hasEmbedding: !!business.embedding,
            embeddingType: typeof business.embedding,
            isArray: Array.isArray(business.embedding)
          });
          return null;
        }

        // Типизирани embedding масиви
        const embedding1: number[] = query_embedding as number[];
        const embedding2: number[] = business.embedding as number[];
        
        console.log(`📊 Embeddings info:`, {
          query_length: embedding1.length,
          business_length: embedding2.length,
          query_sample: embedding1.slice(0, 3),
          business_sample: embedding2.slice(0, 3)
        });
        
        if (embedding1.length !== embedding2.length) {
          console.log(`❌ Embedding dimension mismatch for ${business.name}: ${embedding1.length} vs ${embedding2.length}`);
          return null;
        }

        // Dot product с правилни типове
        const dotProduct: number = embedding1.reduce((sum: number, a: number, i: number) => {
          return sum + (a * embedding2[i]);
        }, 0);
        
        // Magnitudes с правилни типове
        const magnitude1: number = Math.sqrt(embedding1.reduce((sum: number, a: number) => sum + (a * a), 0));
        const magnitude2: number = Math.sqrt(embedding2.reduce((sum: number, a: number) => sum + (a * a), 0));
        
        console.log(`🔢 Calculation details:`, {
          dotProduct: dotProduct.toFixed(6),
          magnitude1: magnitude1.toFixed(6),
          magnitude2: magnitude2.toFixed(6)
        });
        
        // Cosine similarity
        const similarity: number = dotProduct / (magnitude1 * magnitude2);
        
        console.log(`🎯 Similarity for ${business.name}:`, {
          similarity: similarity.toFixed(6),
          similarityAbs: Math.abs(similarity).toFixed(6),
          threshold: threshold,
          passesThreshold: Math.abs(similarity) > threshold
        });
        
        // Проверка за валидност
        if (isNaN(similarity) || !isFinite(similarity)) {
          console.log(`❌ Invalid similarity for ${business.name}: ${similarity}`);
          return null;
        }

        return {
          ...business,
          similarity,
          similarity_percentage: Math.round(Math.abs(similarity) * 100)
        };
      })
      .filter((business: any) => {
        if (!business) return false;
        const passes = Math.abs(business.similarity) > threshold;
        console.log(`✅ Filter result for ${business.name}: ${passes} (${Math.abs(business.similarity).toFixed(6)} > ${threshold})`);
        return passes;
      })
      .sort((a: any, b: any) => Math.abs(b.similarity) - Math.abs(a.similarity))
      .slice(0, limit);

    console.log(`✅ Found ${results.length} matching results above threshold ${threshold}`);

    // 4. Добави категория информация
    if (results.length > 0) {
      const categoryIds = [...new Set(results.map((business: any) => business.category_id))];
      
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('id, name, icon')
        .in('id', categoryIds);

      const enrichedResults = results.map((business: any) => ({
        id: business.id,
        name: business.name,
        description: business.description,
        address: business.address,
        city: business.city,
        phone: business.phone,
        email: business.email,
        website: business.website,
        verified: business.verified,
        rating: business.rating,
        review_count: business.review_count,
        working_hours: business.working_hours,
        custom_fields: business.custom_fields,
        category: categoriesData?.find((cat: any) => cat.id === business.category_id) || null,
        similarity_percentage: business.similarity_percentage
      }));

      return NextResponse.json({
        query: query,
        results: enrichedResults,
        total: enrichedResults.length,
        threshold: threshold,
        method: 'manual_calculation'
      });
    }

    return NextResponse.json({
      query: query,
      results: [],
      total: 0,
      threshold: threshold,
      message: 'Няма намерени резултати над прага на сходство'
    });

  } catch (error: any) {
    console.error('🚫 Simple AI Search Error:', error);
    
    return NextResponse.json({ 
      error: error.message || 'Възникна грешка при семантичното търсене',
      query: requestQuery,
      details: error.toString()
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Simple AI Search API is running',
    model: 'Xenova/all-MiniLM-L6-v2',
    embedding_dimensions: 384,
    method: 'manual_similarity_calculation',
    usage: 'POST with { "query": "вашата заявка" }'
  });
}