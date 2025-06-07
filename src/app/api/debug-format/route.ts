// src/app/api/debug-format/route.ts - Debug на Supabase формат
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
  try {
    console.log('🔍 Debug Supabase format...');

    // Генерирай тестов embedding
    const pipe = await getPipeline();
    const testText = "Тестов ресторант за морска храна";
    const output = await pipe(testText, { pooling: 'mean', normalize: true });
    
    // Различни формати за тестване
    const embedding1 = Array.from(output.data);
    const embedding2 = Array.from(output.data).map(v => Number(v));
    const embedding3 = JSON.stringify(Array.from(output.data));
    
    console.log('🧪 Testing different formats:');
    console.log('Format 1 (Array.from):', {
      length: embedding1.length,
      type: typeof embedding1,
      sample: embedding1.slice(0, 3)
    });
    
    console.log('Format 2 (with Number()):', {
      length: embedding2.length,
      type: typeof embedding2,
      sample: embedding2.slice(0, 3)
    });
    
    console.log('Format 3 (JSON string):', {
      length: embedding3.length,
      type: typeof embedding3,
      sample: embedding3.substring(0, 50)
    });

    // Вземи един бизнес за тестване
    const { data: business } = await supabase
      .from('businesses')
      .select('id, name')
      .limit(1)
      .single();

    if (!business) {
      throw new Error('No business found for testing');
    }

    const testResults = [];

    // Тест 1: Запази като обикновен масив
    console.log('\n🧪 Test 1: Regular array');
    const { error: error1 } = await supabase
      .from('businesses')
      .update({ embedding: embedding1 })
      .eq('id', business.id);

    const { data: check1 } = await supabase
      .from('businesses')
      .select('embedding')
      .eq('id', business.id)
      .single();

    testResults.push({
      test: 'Regular array',
      error: error1?.message,
      saved_length: check1?.embedding?.length,
      saved_type: typeof check1?.embedding
    });

    // Тест 2: Запази като типизиран масив
    console.log('\n🧪 Test 2: Typed array with Number()');
    const { error: error2 } = await supabase
      .from('businesses')
      .update({ embedding: embedding2 })
      .eq('id', business.id);

    const { data: check2 } = await supabase
      .from('businesses')
      .select('embedding')
      .eq('id', business.id)
      .single();

    testResults.push({
      test: 'Typed array',
      error: error2?.message,
      saved_length: check2?.embedding?.length,
      saved_type: typeof check2?.embedding
    });

    // Тест 3: Zapazi като string и parse
    console.log('\n🧪 Test 3: JSON string');
    const { error: error3 } = await supabase
      .from('businesses')
      .update({ embedding: embedding3 })
      .eq('id', business.id);

    const { data: check3 } = await supabase
      .from('businesses')
      .select('embedding')
      .eq('id', business.id)
      .single();

    testResults.push({
      test: 'JSON string',
      error: error3?.message,
      saved_length: check3?.embedding?.length,
      saved_type: typeof check3?.embedding
    });

    // Провери schema на колоната
    const { data: columnInfo } = await supabase.rpc('get_column_info', {
      table_name: 'businesses',
      column_name: 'embedding'
    });

    return NextResponse.json({
      message: 'Format debug completed',
      original_embedding_length: embedding1.length,
      test_results: testResults,
      column_info: columnInfo,
      raw_data: {
        check1_sample: check1?.embedding?.slice?.(0, 5),
        check2_sample: check2?.embedding?.slice?.(0, 5),
        check3_sample: check3?.embedding?.slice?.(0, 50)
      }
    });

  } catch (error: any) {
    console.error('💥 Debug error:', error);
    return NextResponse.json({ 
      error: error.message,
      details: error.toString()
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Debug Format API',
    description: 'Tests different embedding storage formats'
  });
}