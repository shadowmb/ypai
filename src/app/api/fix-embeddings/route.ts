// src/app/api/fix-embeddings/route.ts
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
    console.log('🔧 Starting embedding fix process...');

    // Инициализирай модела
    const pipe = await getPipeline();

    // Първо, изчисти всички съществуващи embeddings
    console.log('🧹 Clearing existing embeddings...');
    
    // Вземи всички бизнеси за да получим техните ID-та
    const { data: allBusinesses, error: fetchError } = await supabase
      .from('businesses')
      .select('id, name, description, custom_fields');

    if (fetchError) {
      console.error('❌ Error fetching businesses:', fetchError);
      throw fetchError;
    }

    if (!allBusinesses || allBusinesses.length === 0) {
      return NextResponse.json({
        message: 'No businesses found',
        processed: 0
      });
    }

    // Изчисти embeddings за всеки бизнес поотделно
    for (const business of allBusinesses) {
      const { error: clearError } = await supabase
        .from('businesses')
        .update({ embedding: null })
        .eq('id', business.id);

      if (clearError) {
        console.error(`❌ Error clearing embedding for ${business.name}:`, clearError);
      }
    }

    console.log(`📊 Found ${allBusinesses.length} businesses to process`);

    let processed = 0;
    let errors = 0;
    const results = [];

    // Обработи всички бизнеси с правилно форматиране
    for (const business of allBusinesses) {
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
        
        // ВАЖНО: Конвертирай правилно във Float32Array и после в обикновен масив
        let embedding: number[];
        
        if (output.data instanceof Float32Array) {
          embedding = Array.from(output.data);
        } else if (Array.isArray(output.data)) {
          embedding = output.data;
        } else {
          embedding = Array.from(output.data);
        }

        console.log(`🧠 Generated embedding:`, {
          length: embedding.length,
          type: typeof embedding,
          isArray: Array.isArray(embedding),
          sample: embedding.slice(0, 3).map(v => v.toFixed(6))
        });

        // Валидация
        if (!Array.isArray(embedding) || embedding.length !== 384) {
          throw new Error(`Invalid embedding format: length=${embedding.length}`);
        }

        const validEmbedding = embedding.every(val => typeof val === 'number' && isFinite(val));
        if (!validEmbedding) {
          throw new Error(`Invalid embedding values`);
        }

        // Запази в базата данни с правилно форматиране
        const { error: updateError } = await supabase
          .from('businesses')
          .update({ 
            embedding: embedding // Директно като число масив
          })
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

        // Проверка - прочети обратно от базата данни
        const { data: checkData } = await supabase
          .from('businesses')
          .select('embedding')
          .eq('id', business.id)
          .single();

        const savedEmbedding = checkData?.embedding;
        console.log(`✅ Verified saved embedding:`, {
          length: savedEmbedding?.length,
          type: typeof savedEmbedding,
          isArray: Array.isArray(savedEmbedding)
        });

        processed++;
        results.push({
          id: business.id,
          name: business.name,
          status: 'success',
          embedding_length: embedding.length,
          saved_length: savedEmbedding?.length
        });

        // Малка пауза
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

    console.log('\n🎉 Embedding fix completed!');

    return NextResponse.json({
      message: 'Embedding fix completed',
      processed,
      errors,
      total: allBusinesses.length,
      results
    });

  } catch (error: any) {
    console.error('💥 General error:', error);
    
    return NextResponse.json({ 
      error: error.message || 'Error fixing embeddings',
      details: error.toString()
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Embedding Fix API',
    description: 'Clears and regenerates all embeddings with proper format',
    usage: 'POST to fix all embeddings'
  });
}