// src/app/api/generate-embeddings/route.ts
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
    console.log('✅ AI model loaded successfully!');
  }
  return pipelineInstance;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { business_id, force_update = false } = body;

    console.log('🤖 Starting embedding generation...');

    // Инициализирай модела
    const pipe = await getPipeline();

    let businessesToProcess;

    if (business_id) {
      // Генерирай за конкретен бизнес
      const { data: business, error } = await supabase
        .from('businesses')
        .select('id, name, description, custom_fields, embedding')
        .eq('id', business_id)
        .single();

      if (error) throw error;
      if (!business) {
        return NextResponse.json({ error: 'Business not found' }, { status: 404 });
      }

      businessesToProcess = [business];
    } else {
      // Генерирай за всички бизнеси без embeddings
      const query = force_update 
        ? supabase.from('businesses').select('id, name, description, custom_fields, embedding')
        : supabase.from('businesses').select('id, name, description, custom_fields, embedding').is('embedding', null);

      const { data: businesses, error } = await query;

      if (error) throw error;
      businessesToProcess = businesses || [];
    }

    if (businessesToProcess.length === 0) {
      return NextResponse.json({
        message: 'No businesses to process',
        processed: 0,
        total: 0
      });
    }

    console.log(`📊 Found ${businessesToProcess.length} businesses to process`);

    let processed = 0;
    let errors = 0;
    const results = [];

    // Обработи всички бизнеси
    for (const business of businessesToProcess) {
      try {
        console.log(`\n🔄 Processing: ${business.name}`);

        // Създай комбиниран текст за embedding
        const content = [
          `Име: ${business.name}`,
          business.description ? `Описание: ${business.description}` : '',
          business.custom_fields ? `Услуги: ${JSON.stringify(business.custom_fields)}` : ''
        ].filter(Boolean).join('. ');

        console.log(`📝 Content: ${content.substring(0, 100)}...`);

        // Генерирай embedding
        const output = await pipe(content, { pooling: 'mean', normalize: true });
        const embedding: number[] = Array.from(output.data);

        console.log(`🧠 Generated embedding with ${embedding.length} dimensions`);
        console.log(`📊 Sample values: [${embedding.slice(0, 5).map((v: number) => v.toFixed(6)).join(', ')}]`);

        // Убедете се, че embedding е число масив с правилна дължина
        if (!Array.isArray(embedding) || embedding.length !== 384) {
          console.error(`❌ Invalid embedding format: length=${embedding.length}, type=${typeof embedding}`);
          continue;
        }

        // Валидирайте, че всички стойности са числа
        const validEmbedding = embedding.every((val: number) => typeof val === 'number' && isFinite(val));
        if (!validEmbedding) {
          console.error(`❌ Invalid embedding values for ${business.name}`);
          continue;
        }

        // Запази в базата данни
        const { error: updateError } = await supabase
          .from('businesses')
          .update({ embedding })
          .eq('id', business.id);

        if (updateError) {
          console.error(`❌ Error saving ${business.name}:`, updateError);
          errors++;
          results.push({
            id: business.id,
            name: business.name,
            status: 'error',
            error: updateError.message
          });
          continue;
        }

        console.log(`✅ Saved embedding for ${business.name}`);
        processed++;
        results.push({
          id: business.id,
          name: business.name,
          status: 'success'
        });

        // Малка пауза за да не претоварим системата
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (businessError: any) {
        console.error(`❌ Error processing ${business.name}:`, businessError);
        errors++;
        results.push({
          id: business.id,
          name: business.name,
          status: 'error',
          error: businessError.message
        });
      }
    }

    // Провери общия брой бизнеси с embeddings
    const { count } = await supabase
      .from('businesses')
      .select('*', { count: 'exact', head: true })
      .not('embedding', 'is', null);

    console.log('\n🎉 Embedding generation completed!');
    console.log(`📊 Total businesses with embeddings: ${count}`);

    return NextResponse.json({
      message: 'Embedding generation completed',
      processed,
      errors,
      total: businessesToProcess.length,
      total_with_embeddings: count,
      results
    });

  } catch (error: any) {
    console.error('💥 General error:', error);
    
    return NextResponse.json({ 
      error: error.message || 'Error generating embeddings',
      details: error.toString()
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Статистики за embeddings
    const { data: stats } = await supabase
      .from('businesses')
      .select('id, embedding')
      .limit(1000);

    const total = stats?.length || 0;
    const withEmbeddings = stats?.filter(b => b.embedding).length || 0;
    const withoutEmbeddings = total - withEmbeddings;

    return NextResponse.json({
      message: 'Embedding generation API',
      model: 'Xenova/all-MiniLM-L6-v2',
      embedding_dimensions: 384,
      stats: {
        total_businesses: total,
        with_embeddings: withEmbeddings,
        without_embeddings: withoutEmbeddings,
        coverage_percentage: total > 0 ? Math.round((withEmbeddings / total) * 100) : 0
      },
      usage: {
        generate_all: 'POST with {}',
        generate_one: 'POST with {"business_id": 123}',
        force_update: 'POST with {"force_update": true}'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}