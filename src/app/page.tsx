// src/app/page.tsx - Поправена версия с AI Search и Admin бутон
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js';
import BusinessCard from '@/components/BusinessCard';
import AISearchBox from '@/components/AISearchBox';
import { Business, AISearchResult, Category } from '@/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function HomePage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchMode, setSearchMode] = useState<'ai' | 'traditional'>('ai');
  const [traditionalQuery, setTraditionalQuery] = useState('');

  // Зареди категории при първо зареждане
  useEffect(() => {
    loadCategories();
    loadBusinesses();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadBusinesses = async (categoryId?: number) => {
    try {
      setLoading(true);
      let query = supabase
        .from('businesses')
        .select(`
          *,
          category:categories(id, name, icon)
        `);

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setBusinesses(data || []);
    } catch (error) {
      console.error('Error loading businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryFilter = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    loadBusinesses(categoryId || undefined);
    setSearchMode('traditional'); // Превключи към традиционно търсене при филтриране
  };

  const handleTraditionalSearch = async () => {
    if (!traditionalQuery.trim()) {
      loadBusinesses(selectedCategory || undefined);
      return;
    }

    try {
      setLoading(true);
      let query = supabase
        .from('businesses')
        .select(`
          *,
          category:categories(id, name, icon)
        `)
        .or(`name.ilike.%${traditionalQuery}%,description.ilike.%${traditionalQuery}%`);

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setBusinesses(data || []);
    } catch (error) {
      console.error('Error searching businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  // Поправена функция за AI Search резултати
  const handleAISearchResults = (results: AISearchResult[]) => {
    // Конвертирай AISearchResult към Business формат
    const convertedBusinesses: Business[] = results.map((result) => ({
      id: result.id,
      name: result.name,
      description: result.description,
      address: result.address,
      city: result.city,
      phone: result.phone || '',
      email: result.email || '',
      website: result.website || '',
      category_id: result.category_id,
      category: result.category ? {
        id: result.category.id,
        name: result.category.name,
        icon: result.category.icon
      } : null,
      verified: result.verified,
      rating: result.rating || 0,
      review_count: result.review_count,
      working_hours: result.working_hours || '',
      custom_fields: result.custom_fields || {},
      created_at: new Date().toISOString(), // Винаги задава стойност
      updated_at: new Date().toISOString()  // Винаги задава стойност
    }));

    setBusinesses(convertedBusinesses);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar with Admin Button */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Brand */}
            <div className="flex items-center">
              <span className="text-xl font-bold text-gray-900">YPAI</span>
              <span className="ml-2 text-sm text-gray-500">Burgas Directory</span>
            </div>
            
            {/* Admin Button */}
            <div className="flex items-center space-x-4">
              <Link 
                href="/admin" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.50a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.50 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.50a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Админ</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              🔍 YPAI
            </h1>
            <p className="text-lg text-gray-600 mb-4">
              AI-подобрена бизнес директория за Бургас
            </p>
            
            {/* Search Mode Toggle */}
            <div className="flex justify-center mb-6">
              <div className="bg-gray-100 rounded-lg p-1 flex">
                <button
                  onClick={() => setSearchMode('ai')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    searchMode === 'ai'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  🤖 AI Търсене
                </button>
                <button
                  onClick={() => setSearchMode('traditional')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    searchMode === 'traditional'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  📝 Традиционно търсене
                </button>
              </div>
            </div>

            {/* AI Search */}
            {searchMode === 'ai' && (
              <AISearchBox onResults={handleAISearchResults} />
            )}

            {/* Traditional Search */}
            {searchMode === 'traditional' && (
              <div className="max-w-2xl mx-auto">
                <div className="flex bg-white rounded-lg shadow-lg border-2 border-gray-200 focus-within:border-blue-500 transition-colors">
                  <input
                    type="text"
                    value={traditionalQuery}
                    onChange={(e) => setTraditionalQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleTraditionalSearch()}
                    placeholder="Търсете по име или описание..."
                    className="flex-1 px-4 py-3 text-lg outline-none rounded-l-lg"
                  />
                  <button
                    onClick={handleTraditionalSearch}
                    className="px-6 py-3 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 transition-colors"
                  >
                    🔍
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Categories Filter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <button
            onClick={() => handleCategoryFilter(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === null
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            🏢 Всички
          </button>
          
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryFilter(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category.icon} {category.name}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {loading ? 'Зареждане...' : `Намерени ${businesses.length} бизнеса`}
          </h2>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="text-4xl animate-spin mx-auto text-blue-500 mb-4">⟳</div>
            <p className="text-gray-600">Зареждане на бизнеси...</p>
          </div>
        )}

        {/* Business Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businesses.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-white rounded-lg">
                <div className="text-4xl mb-4">🤷‍♂️</div>
                <p className="text-gray-600 mb-2">Няма намерени бизнеси</p>
                <p className="text-sm text-gray-500">
                  Опитайте с различни ключови думи или категория
                </p>
              </div>
            ) : (
              businesses.map((business) => (
                <BusinessCard key={business.id} business={business as any} />
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">🤖 AI-подобрено</h3>
              <p className="text-sm text-gray-600">
                Семантично търсене с машинно обучение
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">✅ Верифицирано</h3>
              <p className="text-sm text-gray-600">
                Актуални данни за контакт и услуги
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">🔗 API Ready</h3>
              <p className="text-sm text-gray-600">
                RESTful API за интеграция с AI системи
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}