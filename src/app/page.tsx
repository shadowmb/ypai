'use client'

import { useState, useEffect } from 'react'
import { supabase, Business, Category } from '@/lib/supabase'
import BusinessCard from '@/components/BusinessCard'
import StructuredData from '@/components/StructuredData' 


export default function Home() {
  const [activeTab, setActiveTab] = useState('human')
  const [searchQuery, setSearchQuery] = useState('')
  const [aiQuery, setAiQuery] = useState('GET /api/businesses?category=restaurant&location=sofia&verified=true')
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Зареждане на категориите при стартиране
  useEffect(() => {
    loadCategories()
    loadAllBusinesses()
  }, [])

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')
    
    if (error) {
      console.error('Error loading categories:', error)
    } else {
      setCategories(data || [])
    }
  }

  const loadAllBusinesses = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('businesses')
      .select(`
        *,
        categories (
          id,
          name,
          icon
        )
      `)
      .order('verified', { ascending: false })
      .order('rating', { ascending: false })
    
    if (error) {
      console.error('Error loading businesses:', error)
    } else {
      setBusinesses(data || [])
    }
    setLoading(false)
  }

  const searchBusinesses = async () => {
    if (!searchQuery.trim()) {
      loadAllBusinesses()
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from('businesses')
      .select(`
        *,
        categories (
          id,
          name,
          icon
        )
      `)
      .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%`)
      .order('verified', { ascending: false })
      .order('rating', { ascending: false })

    if (error) {
      console.error('Error searching businesses:', error)
    } else {
      setBusinesses(data || [])
    }
    setLoading(false)
  }

  const filterByCategory = async (categoryId: number) => {
    setSelectedCategory(categoryId.toString())
    setLoading(true)
    
    const { data, error } = await supabase
      .from('businesses')
      .select(`
        *,
        categories (
          id,
          name,
          icon
        )
      `)
      .eq('category_id', categoryId)
      .order('verified', { ascending: false })
      .order('rating', { ascending: false })

    if (error) {
      console.error('Error filtering businesses:', error)
    } else {
      setBusinesses(data || [])
    }
    setLoading(false)
  }

  const showAllBusinesses = () => {
    setSelectedCategory(null)
    setSearchQuery('')
    loadAllBusinesses()
  }

  const performAISearch = async () => {
    try {
      const response = await fetch('/api/businesses?limit=3&verified=true')
      const data = await response.json()
      
      alert(`Real API Response:\n\n${JSON.stringify(data, null, 2)}`)
    } catch (error) {
      alert('API Error: ' + error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="container mx-auto px-5 py-8 max-w-6xl">
        {/* Header */}
        <header className="text-center mb-10 text-white">
          <div className="text-5xl md:text-6xl font-bold mb-4 drop-shadow-lg">
            🟡 YPAI
          </div>
          <div className="text-xl md:text-2xl mb-6 opacity-90">
            Yellow Pages за AI ерата
          </div>
          <div className="inline-block bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full text-sm border border-white/30">
            🤖 AI-Optimized Database
          </div>
          <div className="mt-6">
          
            <a href="/admin"
              className="inline-block bg-white/10 hover:bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-sm border border-white/20 transition-all"
            >
              🛠️ Админ панел
            </a>
          </div>
        </header>

        {/* Search Section */}
        <div className="bg-white rounded-2xl p-8 mb-10 shadow-2xl">
          <div className="flex border-b-2 border-gray-100 mb-6">
            <button
              className={`px-6 py-3 font-medium border-b-3 transition-all ${
                activeTab === 'human' 
                  ? 'text-indigo-600 border-indigo-600 font-semibold' 
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('human')}
            >
              👤 Човешко търсене
            </button>
            <button
              className={`px-6 py-3 font-medium border-b-3 transition-all ${
                activeTab === 'ai' 
                  ? 'text-indigo-600 border-indigo-600 font-semibold' 
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('ai')}
            >
              🤖 AI Agent търсене
            </button>
          </div>

          {activeTab === 'human' ? (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  type="text"
                  className="flex-1 px-6 py-4 border-2 border-gray-200 rounded-xl text-lg focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="Търси фирма, услуга или продукт..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchBusinesses()}
                />
                <button
                  className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all transform hover:-translate-y-1 shadow-lg"
                  onClick={searchBusinesses}
                >
                  🔍 Търси
                </button>
              </div>
              
              {selectedCategory && (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">Филтър активен:</span>
                  <button
                    onClick={showAllBusinesses}
                    className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    ✕ Покажи всички
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                className="flex-1 px-6 py-4 border-2 border-gray-200 rounded-xl text-lg focus:outline-none focus:border-indigo-500 transition-colors font-mono text-sm"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
              />
              <button
                className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all transform hover:-translate-y-1 shadow-lg"
                onClick={performAISearch}
              >
                📡 API Call
              </button>
            </div>
          )}
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {categories.map((category) => (
            <div
              key={category.id}
              className={`bg-white rounded-2xl p-8 text-center cursor-pointer transition-all transform hover:-translate-y-2 hover:shadow-2xl shadow-lg group ${
                selectedCategory === category.id.toString() ? 'ring-4 ring-indigo-400' : ''
              }`}
              onClick={() => filterByCategory(category.id)}
            >
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                {category.icon}
              </div>
              <div className="text-xl font-semibold text-gray-800 mb-2">
                {category.name}
              </div>
              <div className="text-gray-600 text-sm">
                {businesses.filter(b => b.category_id === category.id).length} обекта
              </div>
            </div>
          ))}
        </div>

        {/* Results Section */}
        <div className="bg-white rounded-2xl p-8 mb-10 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800">
              {selectedCategory ? 'Резултати по категория' : 'Всички бизнеси'}
            </h3>
            <span className="text-gray-600">
              {businesses.length} резултата
            </span>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Зареждане...</p>
            </div>
          ) : businesses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {businesses.map((business) => (
                <BusinessCard key={business.id} business={business} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h4 className="text-xl font-semibold text-gray-700 mb-2">
                Няма намерени резултати
              </h4>
              <p className="text-gray-600">
                Опитайте с различна заявка или категория
              </p>
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-2xl p-8 mb-10 shadow-2xl">
          <h3 className="text-2xl font-bold text-gray-800 mb-8 text-center">
            🚀 Защо YPAI?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-l-4 border-indigo-500">
              <h4 className="font-semibold text-gray-800 mb-3 text-lg">⚡ AI-Оптимизирано</h4>
              <p className="text-gray-600">Структурирани данни във формат, който AI агентите четат мгновено</p>
            </div>
            <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-l-4 border-emerald-500">
              <h4 className="font-semibold text-gray-800 mb-3 text-lg">🎯 Точни резултати</h4>
              <p className="text-gray-600">Верифицирана информация с актуални данни за контакт и услуги</p>
            </div>
            <div className="p-6 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border-l-4 border-violet-500">
              <h4 className="font-semibold text-gray-800 mb-3 text-lg">🌐 API Ready</h4>
              <p className="text-gray-600">RESTful API за интеграция с всички AI системи и приложения</p>
            </div>
            <div className="p-6 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl border-l-4 border-rose-500">
              <h4 className="font-semibold text-gray-800 mb-3 text-lg">📱 Отзивчив дизайн</h4>
              <p className="text-gray-600">Работи отлично на всички устройства - десктоп, таблет, мобилен</p>
            </div>
          </div>
        </div>

        {/* API Info */}
        <div className="bg-gray-800 text-white rounded-2xl p-8 text-center shadow-2xl">
          <h3 className="text-2xl font-bold mb-6">🤖 API за AI Агенти</h3>
          <p className="text-gray-300 mb-8">Бърз и лесен достъп до структурирани бизнес данни</p>
          
          <div className="bg-gray-900 p-6 rounded-xl font-mono text-sm mb-8 text-left overflow-x-auto">
            GET https://api.ypai.bg/v1/businesses?category={'{category}'}&location={'{city}'}
          </div>

          <div className="text-sm text-gray-400">
            Общо бизнеси в базата: <span className="text-white font-bold">{businesses.length}</span>
          </div>
        </div>
      </div>
    </div>
  )
}