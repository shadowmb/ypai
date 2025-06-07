/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { pipeline } from '@xenova/transformers'
import { createClient } from '@supabase/supabase-js'

// Инициализирай модела САМО веднъж
// Използваме 'Lazy loading' за модела, за да се зареди само при първо извикване
class PipelineSingleton {
  static task = 'feature-extraction';
  static model = 'Xenova/all-MiniLM-L6-v2';
  static instance = null;

  static async getInstance(progress_callback = null) {
    if (this.instance === null) {
      this.instance = pipeline(this.task, this.model, { progress_callback });
    }
    return this.instance;
  }
}

Deno.serve(async (req) => {
  try {
    const { record } = await req.json()

    // Валидация на входните данни
    if (!record || !record.id || !record.name) {
      return new Response(JSON.stringify({ error: 'Invalid record data provided.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    
    // Свързване със Supabase с администраторски права
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Комбинирай важната информация в един текст
    const content = `Име: ${record.name}. Описание: ${record.description || ''}. Услуги: ${JSON.stringify(record.custom_fields || {})}`

    // 1. Вземи инстанция на пайплайна
    const pipe = await PipelineSingleton.getInstance();
    
    // 2. Генерирай embedding
    const output = await pipe(content, { pooling: 'mean', normalize: true })
    const embedding = Array.from(output.data)

    // 3. Запази embedding-а в базата данни
    const { error } = await supabaseAdmin.from('businesses').update({ embedding }).eq('id', record.id)
    
    if (error) {
        throw error;
    }

    return new Response(JSON.stringify({ success: true, message: `Embedding generated for business ID ${record.id}` }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (err) {
    console.error('Error processing request:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    })
  }
})