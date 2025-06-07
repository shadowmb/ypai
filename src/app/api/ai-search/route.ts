// src/app/api/ai-search-improved/route.ts
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
    console.log('📦 Loading AI model...');
    pipelineInstance = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('✅ AI model loaded!');
  }
  return pipelineInstance;
}

// Категорийни ключови думи за pre-filtering
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'ресторанти': ['ресторант', 'храна', 'ястие', 'кухня', 'меню', 'пицария', 'бар', 'кафе', 'морска храна', 'месо', 'вегетариански', 'пица', 'паста'],
  'хотели': ['хотел', 'настаняване', 'стая', 'резервация', 'почивка', 'нощувка', 'басейн', 'СПА', 'All Inclusive'],
  'красота': ['фризьор', 'красота', 'косми', 'прическа', 'боядисване', 'маникюр', 'педикюр', 'SPA', 'масаж'],
  'медицина': ['лекар', 'дентален', 'зъболекар', 'здраве', 'лечение', 'терапия', 'болница', 'клиника', 'зъб'],
  'автомобили': ['автомобил', 'кола', 'сервиз', 'ремонт', 'гуми', 'масла', 'BMW', 'Mercedes', 'автосервиз', 'мотор'],
  'други': []
};

function detectQueryCategory(query: string): string[] {
  const queryLower = query.toLowerCase();
  const categoryScores: Record<string, number> = {};
  
  // Инициализирай scores
  for (const category of Object.keys(CATEGORY_KEYWORDS)) {
    categoryScores[category] = 0;
  }
  
  // Изчисли scores за всяка категория
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (queryLower.includes(keyword.toLowerCase())) {
        categoryScores[category] += 1;
        
        // Бонус точки за точно съвпадение на цялата дума
        const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`);
        if (regex.test(queryLower)) {
          categoryScores[category] += 2;
        }
      }
    }
  }
  
  // Намери категорията с най-висок score
  const maxScore = Math.max(...Object.values(categoryScores));
  const topCategories = Object.entries(categoryScores)
    .filter(([_, score]) => score > 0 && score >= maxScore * 0.7) // Толерантност 70%
    .map(([category, _]) => category);
  
  console.log(`📊 Category scores:`, categoryScores);
  console.log(`🏆 Top categories:`, topCategories);
  
  return topCategories;
}

function shouldIncludeBusiness(business: any, detectedCategories: string[]): boolean {
  if (detectedCategories.length === 0) return true; // Ако няма категория, включи всички
  
  const businessCategory = business.category?.name?.toLowerCase() || '';
  const businessName = business.name.toLowerCase();
  const businessDescription = business.description.toLowerCase();
  
  // Проверка за директно категорийно съответствие
  for (const category of detectedCategories) {
    // Директно съвпадение с категорията от базата данни
    if (category === 'ресторанти' && businessCategory.includes('ресторант')) return true;
    if (category === 'хотели' && businessCategory.includes('хотел')) return true;
    if (category === 'красота' && (businessCategory.includes('красота') || businessCategory.includes('фризьор'))) return true;
    if (category === 'медицина' && (businessCategory.includes('медицин') || businessCategory.includes('дентал'))) return true;
    if (category === 'автомобили' && (businessCategory.includes('автомобил') || businessCategory.includes('сервиз'))) return true;
    
    // Проверка в описанието и името само за силни индикатори
    const keywords = CATEGORY_KEYWORDS[category] || [];
    const strongKeywords = keywords.filter(k => k.length > 4); // Само дълги думи
    
    const hasStrongMatch = strongKeywords.some(keyword => {
      const keywordLower = keyword.toLowerCase();
      return businessName.includes(keywordLower) || 
             businessDescription.includes(keywordLower);
    });
    
    if (hasStrongMatch) return true;
  }
  
  return false;
}

export async function POST(req: NextRequest) {
  console.log('\n🚀 Improved AI Search API called');
  
  try {
    const body = await req.json();
    const { 
      query, 
      threshold = 0.3, 
      limit = 10,
      business_name,
      category_id 
    } = body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Valid query is required' 
      }, { status: 400 });
    }

    console.log(`🔎 Processing improved search for: "${query}"`);
    
    // 1. Детектирай категория от заявката
    const detectedCategories = detectQueryCategory(query);
    console.log(`📂 Detected categories: ${detectedCategories.join(', ') || 'none'}`);

    // 2. Генерирай embedding за заявката
    const pipe = await getPipeline();
    const output = await pipe(query, { pooling: 'mean', normalize: true });
    const query_embedding = Array.from(output.data);
    
    console.log(`🧠 Generated query embedding with ${query_embedding.length} dimensions`);

    // 3. Вземи всички бизнеси с embeddings
    let businessesQuery = supabase
      .from('businesses')
      .select('id, name, description, address, city, phone, email, website, category_id, working_hours, custom_fields, verified, rating, review_count, embedding, category:categories(id, name, icon)')
      .not('embedding', 'is', null);

    if (business_name) {
      businessesQuery = businessesQuery.ilike('name', `%${business_name}%`);
    }

    if (category_id) {
      businessesQuery = businessesQuery.eq('category_id', category_id);
    }

    const { data: businesses, error } = await businessesQuery;

    if (error) throw error;

    console.log(`📊 Found ${businesses?.length || 0} businesses with embeddings`);

    if (!businesses || businesses.length === 0) {
      return NextResponse.json({
        query,
        results: [],
        total: 0,
        threshold,
        detected_categories: detectedCategories
      });
    }

    // 4. Pre-filter по категории (ако са детектирани)
    let filteredBusinesses = businesses;
    if (detectedCategories.length > 0) {
      filteredBusinesses = businesses.filter(business => 
        shouldIncludeBusiness(business, detectedCategories)
      );
      console.log(`🔍 Category filtering: ${filteredBusinesses.length}/${businesses.length} businesses match detected categories`);
    }

    // 5. Изчисли similarity за филтрираните бизнеси
    const results = filteredBusinesses
      .map((business: any) => {
        if (!business.embedding) return null;

        let embedding2: number[];
        
        if (Array.isArray(business.embedding)) {
          embedding2 = business.embedding;
        } else if (typeof business.embedding === 'string') {
          try {
            embedding2 = JSON.parse(business.embedding);
          } catch {
            return null;
          }
        } else {
          return null;
        }

        if (!Array.isArray(embedding2) || embedding2.length !== 384) {
          return null;
        }

        const embedding1: number[] = query_embedding as number[];
        
        const dotProduct = embedding1.reduce((sum, a, i) => sum + (a * embedding2[i]), 0);
        const magnitude1 = Math.sqrt(embedding1.reduce((sum, a) => sum + (a * a), 0));
        const magnitude2 = Math.sqrt(embedding2.reduce((sum, a) => sum + (a * a), 0));
        const similarity = dotProduct / (magnitude1 * magnitude2);
        
        if (isNaN(similarity) || !isFinite(similarity)) return null;

        return {
          ...business,
          similarity,
          similarity_percentage: Math.round(Math.abs(similarity) * 100)
        };
      })
      .filter((business: any) => business && Math.abs(business.similarity) > threshold)
      .sort((a: any, b: any) => Math.abs(b.similarity) - Math.abs(a.similarity))
      .slice(0, limit);

    console.log(`\n🎉 Returning ${results.length} improved results`);

    return NextResponse.json({
      query,
      results,
      total: results.length,
      threshold,
      detected_categories: detectedCategories,
      category_filtering: detectedCategories.length > 0,
      method: 'improved_semantic_search'
    });

  } catch (error: any) {
    console.error('💥 Improved AI Search error:', error);
    
    return NextResponse.json({ 
      error: error.message || 'Unknown error in improved AI search'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Improved AI Search API',
    features: [
      'Category detection from query',
      'Pre-filtering by detected categories', 
      'Semantic similarity scoring',
      'Improved relevance for business searches'
    ],
    category_keywords: CATEGORY_KEYWORDS
  });
}