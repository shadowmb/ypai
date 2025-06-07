// src/app/test-ai-detailed/page.tsx - Подробен тест на AI Search
'use client';

import { useState } from 'react';

export default function DetailedAITestPage() {
  const [query, setQuery] = useState('ресторант');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [threshold, setThreshold] = useState(0.1);

  const testWithDifferentThresholds = async () => {
    setLoading(true);
    const thresholds = [0.0, 0.1, 0.2, 0.3, 0.5, 0.7];
    const allResults: any = {};

    for (const thresh of thresholds) {
      try {
        const response = await fetch('/api/ai-search-simple', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            threshold: thresh,
            limit: 20
          }),
        });

        const data = await response.json();
        allResults[thresh] = data;
      } catch (error: any) {
        allResults[thresh] = { error: error?.toString() || 'Unknown error' };
      }
    }

    setResults(allResults);
    setLoading(false);
  };

  const testSingleQuery = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai-search-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          threshold,
          limit: 10
        }),
      });

      const data = await response.json();
      setResults({ [threshold]: data });
    } catch (error: any) {
      setResults({ [threshold]: { error: error?.toString() || 'Unknown error' } });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            🔍 Detailed AI Search Test
          </h1>

          {/* Controls */}
          <div className="mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Търсена заявка:
              </label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Въведете заявка за търсене"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Similarity threshold: {threshold}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={testSingleQuery}
                disabled={loading}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? '⟳ Тестване...' : '🔍 Тест с избрания праг'}
              </button>

              <button
                onClick={testWithDifferentThresholds}
                disabled={loading}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
              >
                {loading ? '⟳ Тестване...' : '📊 Тест с всички прагове'}
              </button>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-8">
              <div className="text-4xl animate-spin mx-auto text-blue-500 mb-2">⟳</div>
              <p className="text-gray-600">Тестване на различни прагове...</p>
            </div>
          )}

          {/* Results */}
          {results && !loading && (
            <div className="space-y-6">
              {Object.entries(results).map(([thresh, data]: [string, any]) => (
                <div key={thresh} className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Праг: {thresh} - Резултати: {data.results?.length || 0}
                  </h3>

                  {data.error ? (
                    <div className="bg-red-50 border border-red-200 rounded p-3">
                      <p className="text-red-700">Грешка: {data.error}</p>
                    </div>
                  ) : (
                    <>
                      {data.results && data.results.length > 0 ? (
                        <div className="space-y-2">
                          {data.results.slice(0, 5).map((business: any, index: number) => (
                            <div key={business.id || index} className="bg-gray-50 p-3 rounded border">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h5 className="font-medium text-gray-900">
                                    {business.name}
                                  </h5>
                                  <p className="text-gray-600 text-sm">{business.description}</p>
                                </div>
                                <div className="text-right">
                                  <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mb-1">
                                    {business.similarity_percentage}%
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Raw: {business.similarity?.toFixed(4)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {data.results.length > 5 && (
                            <p className="text-gray-500 text-sm text-center">
                              ... и още {data.results.length - 5} резултата
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-600">Няма резултати за този праг</p>
                      )}

                      {/* Raw data */}
                      <details className="mt-4">
                        <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                          📋 Покажи raw данни
                        </summary>
                        <pre className="mt-2 bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
                          {JSON.stringify(data, null, 2)}
                        </pre>
                      </details>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="text-blue-800 font-semibold mb-2">📋 Инструкции:</h3>
            <ul className="text-blue-700 text-sm space-y-1 list-disc list-inside">
              <li>Опитайте различни заявки: "ресторант", "фризьор", "хотел", "автосервиз"</li>
              <li>Тествайте с различни прагове за да видите как се променят резултатите</li>
              <li>Проверете browser console за подробни логове</li>
              <li>Ако няма резултати с праг 0.0, има проблем с embeddings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}