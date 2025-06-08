// src/app/page.tsx - Enhanced версия с Search, Sort & Pagination
'use client';

import { useState, useEffect, useMemo } from 'react';
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

  // НОВИ STATES ЗА ПОДОБРЕНИЯ
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'verified' | 'created_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'unverified'>('all');

  // Зареди категории при първо зареждане
  useEffect(() => {
    loadCategories();
    loadBusinesses();
  }, []);

  // ФУНКЦИИ ЗА ФИЛТРИРАНЕ И СОРТИРАНЕ
  const filteredAndSortedBusinesses = useMemo(() => {
    let filtered = [...businesses];

    // Филтриране по статус
    if (statusFilter === 'verified') {
      filtered = filtered.filter(b => b.verified);
    } else if (statusFilter === 'unverified') {
      filtered = filtered.filter(b => !b.verified);
    }

    // Сортиране
    filtered.sort((a, b) => {
      let valueA: string | number | boolean;
      let valueB: string | number | boolean;

      switch (sortBy) {
        case 'name':
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
          break;
        case 'rating':
          valueA = a.rating || 0;
          valueB = b.rating || 0;
          break;
        case 'verified':
          valueA = a.verified;
          valueB = b.verified;
          break;
        case 'created_at':
        default:
          valueA = new Date(a.created_at || '').getTime();
          valueB = new Date(b.created_at || '').getTime();
          break;
      }

      if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [businesses, sortBy, sortOrder, statusFilter]);

  // Пагинация
  const totalPages = Math.ceil(filteredAndSortedBusinesses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBusinesses = filteredAndSortedBusinesses.slice(startIndex, startIndex + itemsPerPage);

  // Reset страницата при промяна на филтрите
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, statusFilter, sortBy, itemsPerPage]);

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
    setSearchMode('traditional');
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

  const handleAISearchResults = (results: AISearchResult[]) => {
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    setBusinesses(convertedBusinesses);
    setLoading(false);
  };

  const handleSort = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc'); // Default to desc for new sort
    }
  };

  const getSortIcon = (column: typeof sortBy) => {
    if (sortBy !== column) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  // PAGINATION КОМПОНЕНТ
  const Pagination = () => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages = [];
      const showPages = 5;
      
      let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
      let endPage = Math.min(totalPages, startPage + showPages - 1);
      
      if (endPage - startPage + 1 < showPages) {
        startPage = Math.max(1, endPage - showPages + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      return pages;
    };

    return (
      <div className="bg-white rounded-xl shadow-sm p-6 mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-700 mb-4 sm:mb-0">
            Показване {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAndSortedBusinesses.length)} от {filteredAndSortedBusinesses.length} резултата
          </div>
          
          <nav className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ⏮️
            </button>
            
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border-t border-b border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ⬅️
            </button>

            {getPageNumbers().map((pageNumber) => (
              <button
                key={pageNumber}
                onClick={() => setCurrentPage(pageNumber)}
                className={`px-3 py-2 text-sm font-medium border-t border-b border-gray-300 ${
                  currentPage === pageNumber
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'text-gray-500 bg-white hover:bg-gray-50'
                }`}
              >
                {pageNumber}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border-t border-b border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ➡️
            </button>
            
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ⏭️
            </button>
          </nav>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar with Admin Button */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-gray-900">YPAI</span>
              <span className="ml-2 text-sm text-gray-500">Burgas Directory</span>
            </div>
            
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
            🏢 Всички ({businesses.length})
          </button>
          
          {categories.map((category) => {
            const count = businesses.filter(b => b.category_id === category.id).length;
            return (
              <button
                key={category.id}
                onClick={() => handleCategoryFilter(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category.icon} {category.name} ({count})
              </button>
            );
          })}
        </div>

        {/* НОВИ CONTROLS - Сортиране, Филтриране, View Mode */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Left side - Sort & Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Sort */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">📊 Сортиране:</span>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [newSortBy, newSortOrder] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
                    setSortBy(newSortBy);
                    setSortOrder(newSortOrder);
                  }}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="created_at-desc">📅 Най-нови първо</option>
                  <option value="created_at-asc">📅 Най-стари първо</option>
                  <option value="name-asc">🔤 Име А-Я</option>
                  <option value="name-desc">🔤 Име Я-А</option>
                  <option value="rating-desc">⭐ Най-високо оценени</option>
                  <option value="rating-asc">⭐ Най-ниско оценени</option>
                  <option value="verified-desc">✅ Верифицирани първо</option>
                  <option value="verified-asc">⏳ Неверифицирани първо</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">🏷️ Статус:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Всички</option>
                  <option value="verified">✅ Само верифицирани</option>
                  <option value="unverified">⏳ Неверифицирани</option>
                </select>
              </div>
            </div>

            {/* Right side - View & Pagination controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Items per page */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">📄 На страница:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={6}>6</option>
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                  <option value={48}>48</option>
                  <option value={filteredAndSortedBusinesses.length}>Всички ({filteredAndSortedBusinesses.length})</option>
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">👁️ Изглед:</span>
                <div className="bg-gray-100 rounded-lg p-1 flex">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    ⊞ Мрежа
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      viewMode === 'list'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    ☰ Списък
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                Показване {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAndSortedBusinesses.length)} от {filteredAndSortedBusinesses.length} резултата
                {(statusFilter !== 'all' || selectedCategory !== null) && (
                  <span className="ml-2 text-blue-600">
                    (филтрирани от общо {businesses.length})
                  </span>
                )}
              </div>
              
              {/* Active Filters */}
              <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                {statusFilter !== 'all' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {statusFilter === 'verified' ? '✅ Верифицирани' : '⏳ Неверифицирани'}
                    <button 
                      onClick={() => setStatusFilter('all')}
                      className="ml-1.5 text-blue-600 hover:text-blue-800"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {selectedCategory !== null && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {categories.find(c => c.id === selectedCategory)?.icon} {categories.find(c => c.id === selectedCategory)?.name}
                    <button 
                      onClick={() => handleCategoryFilter(null)}
                      className="ml-1.5 text-blue-600 hover:text-blue-800"
                    >
                      ✕
                    </button>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="text-4xl animate-spin mx-auto text-blue-500 mb-4">⟳</div>
            <p className="text-gray-600">Зареждане на бизнеси...</p>
          </div>
        )}

        {/* Business Grid/List */}
        {!loading && (
          <>
            {filteredAndSortedBusinesses.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg">
                <div className="text-4xl mb-4">🤷‍♂️</div>
                <p className="text-gray-600 mb-2">Няма намерени бизнеси</p>
                <p className="text-sm text-gray-500">
                  Опитайте с различни ключови думи или филтри
                </p>
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
              }>
                {paginatedBusinesses.map((business) => (
                  <div key={business.id} className={viewMode === 'list' 
                    ? "bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
                    : ""
                  }>
                    <BusinessCard business={business as any} viewMode={viewMode} />
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            <Pagination />
          </>
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