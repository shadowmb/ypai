// src/app/api/pgvector-fix/route.ts - Поправка с правилен pgvector формат
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
    const { business_id } = body;

    console.log('🔧 Starting pgvector format fix...');

    // Инициализирай модела
    const pipe = await getPipeline();

    let businessesToProcess;

    if (business_id) {
      // Обработи конкретен бизнес
      const { data: business, error } = await supabase
        .from('businesses')
        .select('id, name, description, custom_fields')
        .eq('id', business_id)
        .single();

      if (error) throw error;
      if (!business) {
        return NextResponse.json({ error: 'Business not found' }, { status: 404 });
      }

      businessesToProcess = [business];
    } else {
      // Обработи първите 3 бизнеса за тестване
      const { data: businesses, error } = await supabase
        .from('businesses')
        .select('id, name, description, custom_fields')
        .limit(3);

      if (error) throw error;
      businessesToProcess = businesses || [];
    }

    if (businessesToProcess.length === 0) {
      return NextResponse.json({
        message: 'No businesses to process',
        processed: 0
      });
    }

    console.log(`📊 Processing ${businessesToProcess.length} businesses`);

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
        
        // Конвертирай във Float32Array и после в специален pgvector формат
        let rawEmbedding: number[];
        
        if (output.data instanceof Float32Array) {
          rawEmbedding = Array.from(output.data);
        } else {
          rawEmbedding = Array.from(output.data);
        }

        console.log(`🧠 Raw embedding:`, {
          length: rawEmbedding.length,
          sample: rawEmbedding.slice(0, 3).map((v: number) => v.toFixed(6))
        });

        // Валидация
        if (rawEmbedding.length !== 384) {
          throw new Error(`Invalid embedding length: ${rawEmbedding.length}`);
        }

        // pgvector формат - като string с bracket format
        const pgvectorString = `[${rawEmbedding.join(',')}]`;
        
        console.log(`📦 pgvector format:`, {
          type: typeof pgvectorString,
          length: pgvectorString.length,
          preview: pgvectorString.substring(0, 50) + '...'
        });

        // Запази в базата данни с pgvector формат
        const { error: updateError } = await supabase
          .from('businesses')
          .update({ 
            embedding: pgvectorString // Като pgvector string
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

        // Проверка - прочети обратно
        const { data: checkData } = await supabase
          .from('businesses')
          .select('embedding')
          .eq('id', business.id)
          .single();

        const savedEmbedding = checkData?.embedding;
        console.log(`✅ Verified saved embedding:`, {
          length: savedEmbedding?.length,
          type: typeof savedEmbedding,
          isArray: Array.isArray(savedEmbedding),
          preview: Array.isArray(savedEmbedding) ? 
            `Array[${savedEmbedding.length}]` : 
            savedEmbedding?.toString().substring(0, 50)
        });

        processed++;
        results.push({
          id: business.id,
          name: business.name,
          status: 'success',
          original_length: rawEmbedding.length,
          saved_length: savedEmbedding?.length,
          saved_type: typeof savedEmbedding
        });

        // Пауза
        await new Promise(resolve => setTimeout(resolve, 200));

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

    console.log('\n🎉 pgvector format fix completed!');

    return NextResponse.json({
      message: 'pgvector format fix completed',
      processed,
      errors,
      total: businessesToProcess.length,
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
    message: 'pgvector Format Fix API',
    description: 'Fixes embeddings using proper pgvector format',
    usage: {
      fix_sample: 'POST with {}',
      fix_one: 'POST with {"business_id": 123}'
    }
  });
}