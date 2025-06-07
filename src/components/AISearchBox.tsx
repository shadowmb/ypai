// src/components/AISearchBox.tsx
'use client';

import { useState } from 'react';
import { AISearchResult } from '@/types';
// Заменяме lucide-react иконите с емоджи иконки
// import { Search, Sparkles, Loader2 } from 'lucide-react';

interface AISearchBoxProps {
  onResults?: (results: AISearchResult[]) => void;
}

export default function AISearchBox({ onResults }: AISearchBoxProps) {
  const [query, setQuery] = useState('');
  const [threshold, setThreshold] = useState(0.2); // Добавяме threshold state
  const [results, setResults] = useState<AISearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastQuery, setLastQuery] = useState('');

  const handleSearch = async () => {
    if (!query.trim() || loading) return;

    setLoading(true);
    setLastQuery(query);

    try {
      const response = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: query.trim(),
          threshold: threshold,
          limit: 15 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResults(data.results || []);
        onResults?.(data.results || []);
      } else {
        console.error('Search error:', data.error);
        setResults([]);
      }
    } catch (error) {
      console.error('Network error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Search Input */}
      <div className="relative mb-6">
        <div className="flex bg-white rounded-lg shadow-lg border-2 border-blue-100 focus-within:border-blue-500 transition-colors">
          <div className="flex items-center px-4 text-blue-500 text-xl">
            ✨
          </div>
          
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Опишете какво търсите... (напр. 'ресторант с морска храна в центъра')"
            className="flex-1 px-4 py-4 text-lg outline-none rounded-lg"
            disabled={loading}
          />
          
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="px-6 py-4 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="animate-spin text-lg">⟳</div>
            ) : (
              <span className="text-lg">🔍</span>
            )}
          </button>
        </div>
        
        {/* AI Indicator */}
        <div className="absolute -top-2 left-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
          🤖 AI Семантично търсене
        </div>
      </div>

      {/* Similarity Threshold Slider */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">
            Праг на сходство: {Math.round(threshold * 100)}%
          </label>
          <div className="text-xs text-gray-500">
            {threshold < 0.3 ? 'Широко търсене' : threshold < 0.6 ? 'Балансирано' : 'Точно търсене'}
          </div>
        </div>
        
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={threshold}
          onChange={(e) => setThreshold(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${threshold * 100}%, #e5e7eb ${threshold * 100}%, #e5e7eb 100%)`
          }}
          disabled={loading}
        />
        
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0% - Повече резултати</span>
          <span>100% - По-точни резултати</span>
        </div>
        
        <p className="text-xs text-gray-600 mt-2">
          💡 По-нисък праг показва повече резултати, но може да включи по-малко релевантни бизнеси.
        </p>
      </div>

      {/* Results */}
      {loading && (
        <div className="text-center py-8">
          <div className="text-4xl animate-spin mx-auto text-blue-500 mb-2">⟳</div>
          <p className="text-gray-600">Анализирам заявката...</p>
        </div>
      )}

      {!loading && lastQuery && results.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-2">Няма намерени резултати за "{lastQuery}"</p>
          <p className="text-sm text-gray-500">Опитайте с различни ключови думи</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">
              Намерени {results.length} резултата за "{lastQuery}"
            </h3>
          </div>

          <div className="grid gap-4">
            {results.map((business) => (
              <div key={business.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{business.category?.icon || '🏢'}</span>
                    <div>
                      <h4 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        {business.name}
                        {business.verified && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            ✓ Verified
                          </span>
                        )}
                      </h4>
                      <p className="text-gray-600">{business.category?.name}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mb-1">
                      {business.similarity_percentage}% съвпадение
                    </div>
                    {(business.rating ?? 0) > 0 && (
                      <div className="text-yellow-500 text-sm">
                        ⭐ {business.rating}/5
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-gray-700 mb-3">{business.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span>📍</span>
                    <span>{business.address}</span>
                  </div>
                  
                  {business.phone && (
                    <div className="flex items-center gap-2">
                      <span>📞</span>
                      <span>{business.phone}</span>
                    </div>
                  )}
                  
                  {business.website && (
                    <div className="flex items-center gap-2 md:col-span-2">
                      <span>🌐</span>
                      <a 
                        href={business.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {business.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}