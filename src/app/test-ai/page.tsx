// src/app/test-ai/page.tsx - Тестова страница за AI Search
'use client';

import { useState } from 'react';

export default function TestAIPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [embeddings, setEmbeddings] = useState<any>(null);

  const testAPIConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/ai-search-simple');
      const data = await response.json();
      
      setResults(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateEmbeddings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/generate-embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      
      if (response.ok) {
        setEmbeddings(data);
      } else {
        setError(data.error || 'Грешка при генериране на embeddings');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testAISearch = async () => {
    if (!query.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/ai-search-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          threshold: 0.5, // По-нисък праг за тестване
          limit: 5
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setResults(data);
      } else {
        setError(data.error || 'API грешка');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            🧪 AI Search Test Page
          </h1>

          {/* API Connection Test */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              1. Тест на API връзка
            </h2>
            <button
              onClick={testAPIConnection}
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? '⟳ Тестване...' : '🔗 Тествай API връзка'}
            </button>
          </div>

          {/* Generate Embeddings */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              2. Генериране на embeddings
            </h2>
            <button
              onClick={generateEmbeddings}
              disabled={loading}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50 mr-3"
            >
              {loading ? '⟳ Генериране...' : '🤖 Генерирай embeddings'}
            </button>
            <p className="text-sm text-gray-600 mt-2">
              Това ще генерира AI embeddings за всички бизнеси в базата данни
            </p>
          </div>

          {/* AI Search Test */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              3. Тест на AI Search
            </h2>
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Въведете тестова заявка (напр: 'ресторант')"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && testAISearch()}
              />
              <button
                onClick={testAISearch}
                disabled={loading || !query.trim()}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
              >
                {loading ? '⟳ Търси...' : '🔍 AI Търсене'}
              </button>
            </div>

            {/* Предварително зададени тестове */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => { setQuery('ресторант морска храна'); }}
                className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300"
              >
                🍽️ ресторант морска храна
              </button>
              <button
                onClick={() => { setQuery('фризьор в центъра'); }}
                className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300"
              >
                ✂️ фризьор в центъра
              </button>
              <button
                onClick={() => { setQuery('автосервиз BMW'); }}
                className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300"
              >
                🚗 автосервиз BMW
              </button>
              <button
                onClick={() => { setQuery('хотел море бургас'); }}
                className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300"
              >
                🏨 хотел море бургас
              </button>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-4">
              <div className="text-2xl animate-spin mx-auto text-blue-500 mb-2">⟳</div>
              <p className="text-gray-600">Обработка...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <h3 className="text-red-800 font-semibold mb-2">❌ Грешка:</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Embeddings Results */}
          {embeddings && !loading && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
              <h3 className="text-green-800 font-semibold mb-2">🤖 Embeddings генерирани:</h3>
              <div className="text-green-700 text-sm">
                <p>✅ Обработени: {embeddings.processed}</p>
                <p>❌ Грешки: {embeddings.errors}</p>
                <p>📊 Общо с embeddings: {embeddings.total_with_embeddings}</p>
              </div>
            </div>
          )}

          {/* Results */}
          {results && !loading && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <h3 className="text-gray-800 font-semibold mb-3">📊 Резултати:</h3>
              <pre className="bg-white p-3 rounded border text-sm overflow-auto max-h-96">
                {JSON.stringify(results, null, 2)}
              </pre>
              
              {/* Readable results */}
              {results.results && results.results.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold text-gray-800 mb-2">
                    🎯 Намерени {results.results.length} резултата:
                  </h4>
                  <div className="space-y-2">
                    {results.results.map((business: any, index: number) => (
                      <div key={business.id || index} className="bg-white p-3 rounded border">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-medium text-gray-900">
                              {business.name}
                              {business.verified && (
                                <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                                  ✅ Verified
                                </span>
                              )}
                            </h5>
                            <p className="text-gray-600 text-sm">{business.description}</p>
                            <p className="text-gray-500 text-xs">📍 {business.address}</p>
                          </div>
                          {business.similarity_percentage && (
                            <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                              {business.similarity_percentage}% match
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="text-blue-800 font-semibold mb-2">📋 Инструкции:</h3>
          <ol className="text-blue-700 text-sm space-y-1 list-decimal list-inside">
            <li>Първо тествайте API връзката с бутона "Тествай API връзка"</li>
            <li>Ако API-то работи, опитайте AI търсене с примерните заявки</li>
            <li>Проверете в конзолата на браузъра за повече подробности</li>
            <li>Ако има грешки, споделете ги за анализ</li>
          </ol>
        </div>
      </div>
    </div>
  );
}