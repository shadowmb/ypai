'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ApiDocs() {
  const [activeEndpoint, setActiveEndpoint] = useState('businesses')

  const endpoints = {
    businesses: {
      title: 'Businesses API',
      description: 'Retrieve and manage business listings',
      methods: [
        {
          method: 'GET',
          url: '/api/businesses',
          description: 'Get businesses with optional filtering',
          parameters: [
            { name: 'category', type: 'string', description: 'Filter by category ID or slug (e.g., "restaurants", "1")' },
            { name: 'location', type: 'string', description: 'Filter by city name (partial match)' },
            { name: 'verified', type: 'boolean', description: 'Filter by verification status ("true" or "false")' },
            { name: 'search', type: 'string', description: 'Search in name, description, and city' },
            { name: 'limit', type: 'number', description: 'Number of results to return (default: 50, max: 100)' },
            { name: 'offset', type: 'number', description: 'Number of results to skip for pagination (default: 0)' }
          ],
          example: '/api/businesses?category=restaurants&location=sofia&verified=true&limit=10'
        },
        {
          method: 'POST',
          url: '/api/businesses',
          description: 'Create a new business listing',
          body: {
            name: 'string (required)',
            category_id: 'number (required)',
            description: 'string (optional)',
            address: 'string (optional)',
            city: 'string (optional)',
            phone: 'string (optional)',
            email: 'string (optional)',
            website: 'string (optional)',
            verified: 'boolean (optional, default: false)'
          }
        }
      ]
    },
    categories: {
      title: 'Categories API',
      description: 'Retrieve available business categories',
      methods: [
        {
          method: 'GET',
          url: '/api/categories',
          description: 'Get all available categories',
          parameters: [
            { name: 'include_count', type: 'boolean', description: 'Include business count for each category ("true" or "false")' }
          ],
          example: '/api/categories?include_count=true'
        }
      ]
    }
  }

  const sampleResponses = {
    businesses: {
      success: true,
      data: [
        {
          id: 1,
          name: "Pizza Express",
          description: "Автентична италианска пица с доставка",
          category: "Ресторанти",
          category_slug: "restaurants",
          category_icon: "🍽️",
          address: "ул. Витоша 15",
          city: "София",
          phone: "+359 2 123 4567",
          email: "info@pizzaexpress.bg",
          website: "www.pizzaexpress.bg",
          verified: true,
          rating: 4.5,
          review_count: 234,
          created_at: "2025-01-15T10:30:00.000Z"
        }
      ],
      pagination: {
        total: 5,
        limit: 50,
        offset: 0,
        has_more: false
      },
      query_info: {
        filters_applied: {
          category: "restaurants",
          location: "софия",
          verified: "true",
          search: null
        },
        execution_time: 1704445800000
      }
    },
    categories: {
      success: true,
      data: [
        {
          id: 1,
          name: "Ресторанти",
          slug: "restaurants",
          icon: "🍽️",
          description: "Ресторанти, барове, кафенета",
          business_count: 15
        },
        {
          id: 2,
          name: "Услуги",
          slug: "services",
          icon: "🔧",
          description: "Всякакви услуги за дома и бизнеса",
          business_count: 23
        }
      ],
      total: 6
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                📚 YPAI API Documentation
              </h1>
              <p className="text-xl text-gray-600 mb-4">
                RESTful API за AI агенти и разработчици
              </p>
              <p className="text-gray-500">
                Версия: 1.0 | Базов URL: <code className="bg-gray-100 px-2 py-1 rounded">https://yoursite.vercel.app</code>
              </p>
            </div>
            <div className="flex gap-4">
              <Link
                href="/"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                ← Главна страница
              </Link>
              <Link
                href="/admin"
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                🛠️ Админ панел
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Start */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">🚀 Quick Start</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">За AI агенти</h3>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
                <div># Всички бизнеси</div>
                <div>GET /api/businesses</div>
                <div className="mt-2"># Филтрирани резултати</div>
                <div>GET /api/businesses?category=restaurants&verified=true</div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Отговор формат</h3>
              <div className="bg-gray-100 p-4 rounded-lg">
                <div className="text-sm text-gray-600">
                  ✅ JSON формат<br/>
                  ✅ Structured data<br/>
                  ✅ Pagination support<br/>
                  ✅ Error handling<br/>
                  ✅ CORS enabled
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex gap-4">
            {Object.entries(endpoints).map(([key, endpoint]) => (
              <button
                key={key}
                onClick={() => setActiveEndpoint(key)}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeEndpoint === key
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {endpoint.title}
              </button>
            ))}
          </div>
        </div>

        {/* Endpoint Details */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {endpoints[activeEndpoint as keyof typeof endpoints].title}
            </h2>
            <p className="text-lg text-gray-600">
              {endpoints[activeEndpoint as keyof typeof endpoints].description}
            </p>
          </div>

          {endpoints[activeEndpoint as keyof typeof endpoints].methods.map((method, index) => (
            <div key={index} className="mb-12 last:mb-0">
              <div className="flex items-center gap-4 mb-6">
                <span className={`px-3 py-1 rounded font-mono text-sm font-bold text-white ${
                  method.method === 'GET' ? 'bg-green-600' : 
                  method.method === 'POST' ? 'bg-blue-600' : 'bg-gray-600'
                }`}>
                  {method.method}
                </span>
                <code className="text-lg bg-gray-100 px-4 py-2 rounded">{method.url}</code>
              </div>

              <p className="text-gray-700 mb-6">{method.description}</p>

              {method.parameters && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Query Parameters</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Parameter</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Type</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {method.parameters.map((param, i) => (
                          <tr key={i}>
                            <td className="px-4 py-3 font-mono text-sm text-indigo-600">{param.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{param.type}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{param.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

                {('body' in method) && method.body && (
                <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Request Body</h4>
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
                    <pre>{JSON.stringify(method.body, null, 2)}</pre>
                    </div>
                </div>
                )}

              {method.example && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Example Request</h4>
                  <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
                    GET {method.example}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Sample Response */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📄 Sample Response</h2>
          <div className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto">
            <pre className="text-sm">
              {JSON.stringify(sampleResponses[activeEndpoint as keyof typeof sampleResponses], null, 2)}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-800 text-white rounded-xl p-8 mt-8 text-center">
          <h3 className="text-xl font-bold mb-4">🤖 Ready for AI Integration</h3>
          <p className="text-gray-300 mb-4">
            YPAI API е оптимизирано за AI агенти с structured data, бърз response time и comprehensive error handling.
          </p>
          <div className="text-sm text-gray-400">
            Rate limit: 1000 requests/hour | Support: hello@ypai.bg
          </div>
        </div>
      </div>
    </div>
  )
}