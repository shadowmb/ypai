// src/app/debug-db/page.tsx - Debug страница за проверка на базата данни
'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DebugPage() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkDatabase = async () => {
    try {
      setLoading(true);
      setError(null);

      // Провери категории
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*');

      if (categoriesError) {
        throw new Error(`Categories error: ${categoriesError.message}`);
      }

      // Провери бизнеси
      const { data: businessesData, error: businessesError } = await supabase
        .from('businesses')
        .select(`
          id,
          name,
          description,
          address,
          category_id,
          embedding,
          created_at,
          category:categories(name, icon)
        `);

      if (businessesError) {
        throw new Error(`Businesses error: ${businessesError.message}`);
      }

      setCategories(categoriesData || []);
      setBusinesses(businessesData || []);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addTestBusiness = async () => {
    try {
      setLoading(true);
      setError(null);

      // Първо провери дали има категория за ресторанти
      let { data: category } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', 'restorants')
        .single();

      if (!category) {
        // Създай категория ако няма
        const { data: newCategory, error: categoryError } = await supabase
          .from('categories')
          .insert({
            name: 'Ресторанти',
            slug: 'restorants',
            icon: '🍽️',
            description: 'Ресторанти и заведения за хранене'
          })
          .select('id')
          .single();

        if (categoryError) throw categoryError;
        category = newCategory;
      }

      // Добави тестов бизнес
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .insert({
          name: 'Тест Ресторант',
          description: 'Тестов ресторант за проверка на AI търсене',
          address: 'тест адрес 123',
          city: 'Бургас',
          phone: '+359 56 123456',
          category_id: category.id,
          working_hours: 'Всеки ден: 10:00-22:00',
          custom_fields: {
            cuisine_type: 'Българска кухня',
            services: ['Доставка', 'Резервации']
          },
          verified: true,
          rating: 4.5,
          review_count: 10
        })
        .select()
        .single();

      if (businessError) throw businessError;

      alert('Тестов бизнес добавен успешно!');
      checkDatabase(); // Обнови данните

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateEmbeddingForBusiness = async (businessId: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/generate-embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          business_id: businessId
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Embedding генериран за бизнес ID: ${businessId}`);
        checkDatabase(); // Обнови данните
      } else {
        setError(data.error || 'Грешка при генериране на embedding');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            🔍 Database Debug Page
          </h1>

          {/* Actions */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={checkDatabase}
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? '⟳ Проверява...' : '🔍 Провери базата данни'}
            </button>
            
            <button
              onClick={addTestBusiness}
              disabled={loading}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? '⟳ Добавя...' : '➕ Добави тестов бизнес'}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <h3 className="text-red-800 font-semibold mb-2">❌ Грешка:</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Categories */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              📂 Категории ({categories.length})
            </h2>
            {categories.length === 0 ? (
              <p className="text-gray-600">Няма категории в базата данни</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {categories.map((category) => (
                  <div key={category.id} className="bg-gray-100 p-3 rounded">
                    <span className="text-lg">{category.icon}</span>
                    <span className="ml-2 font-medium">{category.name}</span>
                    <span className="text-sm text-gray-500 ml-2">(ID: {category.id})</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Businesses */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              🏢 Бизнеси ({businesses.length})
            </h2>
            {businesses.length === 0 ? (
              <p className="text-gray-600">Няма бизнеси в базата данни</p>
            ) : (
              <div className="space-y-3">
                {businesses.map((business) => (
                  <div key={business.id} className="bg-gray-50 p-4 rounded border">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 flex items-center gap-2">
                          {business.category?.icon} {business.name}
                          <span className="text-sm text-gray-500">(ID: {business.id})</span>
                        </h3>
                        <p className="text-gray-600 text-sm">{business.description}</p>
                        <p className="text-gray-500 text-xs">📍 {business.address}</p>
                        <p className="text-gray-500 text-xs">🗂️ Категория: {business.category?.name || 'Няма'}</p>
                        <p className="text-gray-500 text-xs">
                          🤖 Embedding: {business.embedding ? '✅ Има' : '❌ Няма'}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        {!business.embedding && (
                          <button
                            onClick={() => generateEmbeddingForBusiness(business.id)}
                            disabled={loading}
                            className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600 disabled:opacity-50"
                          >
                            🤖 Генерирай
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Statistics */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="text-blue-800 font-semibold mb-2">📊 Статистики:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-blue-700 text-sm">
              <div>
                <span className="font-medium">Категории:</span>
                <div className="text-lg">{categories.length}</div>
              </div>
              <div>
                <span className="font-medium">Бизнеси:</span>
                <div className="text-lg">{businesses.length}</div>
              </div>
              <div>
                <span className="font-medium">С embeddings:</span>
                <div className="text-lg">
                  {businesses.filter(b => b.embedding).length}
                </div>
              </div>
              <div>
                <span className="font-medium">Без embeddings:</span>
                <div className="text-lg">
                  {businesses.filter(b => !b.embedding).length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}