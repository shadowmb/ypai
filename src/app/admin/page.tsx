'use client'

import { useState, useEffect } from 'react'
import { supabase, Business, Category } from '@/lib/supabase'
import Link from 'next/link'


export default function AdminPanel() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    totalBusinesses: 0,
    verifiedBusinesses: 0,
    totalCategories: 0
  })

  const [newBusiness, setNewBusiness] = useState({
    name: '',
    description: '',
    category_id: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    website: '',
    verified: false
  })

  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    category_id: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    website: '',
    verified: false
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    
    // Зареждане на бизнеси
    const { data: businessData } = await supabase
      .from('businesses')
      .select(`
        *,
        categories (
          id,
          name,
          icon
        )
      `)
      .order('created_at', { ascending: false })

    // Зареждане на категории
    const { data: categoryData } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    if (businessData) setBusinesses(businessData)
    if (categoryData) setCategories(categoryData)

    // Статистики
    setStats({
      totalBusinesses: businessData?.length || 0,
      verifiedBusinesses: businessData?.filter(b => b.verified).length || 0,
      totalCategories: categoryData?.length || 0
    })

    setLoading(false)
  }

  const addBusiness = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase
      .from('businesses')
      .insert([{
        ...newBusiness,
        category_id: parseInt(newBusiness.category_id),
        rating: 0,
        review_count: 0
      }])

    if (error) {
      alert('Грешка при добавяне: ' + error.message)
    } else {
      alert('Бизнесът е добавен успешно!')
      setNewBusiness({
        name: '',
        description: '',
        category_id: '',
        address: '',
        city: '',
        phone: '',
        email: '',
        website: '',
        verified: false
      })
      setShowAddForm(false)
      loadData()
    }

    setLoading(false)
  }

  const startEdit = (business: Business) => {
    setEditingBusiness(business)
    setEditForm({
      name: business.name,
      description: business.description || '',
      category_id: business.category_id.toString(),
      address: business.address || '',
      city: business.city || '',
      phone: business.phone || '',
      email: business.email || '',
      website: business.website || '',
      verified: business.verified
    })
  }

  const cancelEdit = () => {
    setEditingBusiness(null)
    setEditForm({
      name: '',
      description: '',
      category_id: '',
      address: '',
      city: '',
      phone: '',
      email: '',
      website: '',
      verified: false
    })
  }

  const updateBusiness = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingBusiness) return
    
    setLoading(true)

    const { error } = await supabase
      .from('businesses')
      .update({
        ...editForm,
        category_id: parseInt(editForm.category_id),
        updated_at: new Date().toISOString()
      })
      .eq('id', editingBusiness.id)

    if (error) {
      alert('Грешка при редакция: ' + error.message)
    } else {
      alert('Бизнесът е редактиран успешно!')
      cancelEdit()
      loadData()
    }

    setLoading(false)
  }

  const toggleVerification = async (businessId: number, currentStatus: boolean) => {
    const { error } = await supabase
      .from('businesses')
      .update({ verified: !currentStatus })
      .eq('id', businessId)

    if (error) {
      alert('Грешка при промяна: ' + error.message)
    } else {
      loadData()
    }
  }

  const deleteBusiness = async (businessId: number, businessName: string) => {
    if (confirm(`Сигурни ли сте, че искате да изтриете "${businessName}"?`)) {
      const { error } = await supabase
        .from('businesses')
        .delete()
        .eq('id', businessId)

      if (error) {
        alert('Грешка при изтриване: ' + error.message)
      } else {
        alert('Бизнесът е изтрит успешно!')
        loadData()
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🛠️ YPAI Admin Panel</h1>
              <p className="text-gray-600 mt-2">Управление на бизнеси и категории</p>
            </div>
            <Link
                href="/"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                ← Към сайта
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <span className="text-2xl">🏢</span>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Общо бизнеси</h3>
                <p className="text-3xl font-bold text-blue-600">{stats.totalBusinesses}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Верифицирани</h3>
                <p className="text-3xl font-bold text-green-600">{stats.verifiedBusinesses}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <span className="text-2xl">📂</span>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Категории</h3>
                <p className="text-3xl font-bold text-purple-600">{stats.totalCategories}</p>
              </div>
            </div>
          </div>
        </div>

       {/* Action Buttons */}
       <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center"
            >
              {showAddForm ? '✕ Затвори' : '+ Добави нов бизнес'}
            </button>

            <Link
              href="/admin/import"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center"
            >
              📊 Bulk Import
            </Link>

            <Link
              href="/api-docs"
              target="_blank"
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center"
            >
              📚 API Docs
            </Link>
          </div>
        </div>

        {/* Add/Edit Business Form */}
        {(showAddForm || editingBusiness) && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingBusiness ? '✏️ Редактиране на бизнес' : '➕ Добавяне на нов бизнес'}
              </h2>
              <button
                onClick={editingBusiness ? cancelEdit : () => setShowAddForm(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={editingBusiness ? updateBusiness : addBusiness} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Име на бизнеса *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={editingBusiness ? editForm.name : newBusiness.name}
                  onChange={(e) => editingBusiness 
                    ? setEditForm({ ...editForm, name: e.target.value })
                    : setNewBusiness({ ...newBusiness, name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Категория *
                </label>
                <select
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={editingBusiness ? editForm.category_id : newBusiness.category_id}
                  onChange={(e) => editingBusiness 
                    ? setEditForm({ ...editForm, category_id: e.target.value })
                    : setNewBusiness({ ...newBusiness, category_id: e.target.value })
                  }
                >
                  <option value="">Избери категория</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание
                </label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={editingBusiness ? editForm.description : newBusiness.description}
                  onChange={(e) => editingBusiness 
                    ? setEditForm({ ...editForm, description: e.target.value })
                    : setNewBusiness({ ...newBusiness, description: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Адрес
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={editingBusiness ? editForm.address : newBusiness.address}
                  onChange={(e) => editingBusiness 
                    ? setEditForm({ ...editForm, address: e.target.value })
                    : setNewBusiness({ ...newBusiness, address: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Град
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={editingBusiness ? editForm.city : newBusiness.city}
                  onChange={(e) => editingBusiness 
                    ? setEditForm({ ...editForm, city: e.target.value })
                    : setNewBusiness({ ...newBusiness, city: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Телефон
                </label>
                <input
                  type="tel"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={editingBusiness ? editForm.phone : newBusiness.phone}
                  onChange={(e) => editingBusiness 
                    ? setEditForm({ ...editForm, phone: e.target.value })
                    : setNewBusiness({ ...newBusiness, phone: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={editingBusiness ? editForm.email : newBusiness.email}
                  onChange={(e) => editingBusiness 
                    ? setEditForm({ ...editForm, email: e.target.value })
                    : setNewBusiness({ ...newBusiness, email: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Уебсайт
                </label>
                <input
                  type="url"
                  placeholder="example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={editingBusiness ? editForm.website : newBusiness.website}
                  onChange={(e) => editingBusiness 
                    ? setEditForm({ ...editForm, website: e.target.value })
                    : setNewBusiness({ ...newBusiness, website: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="verified"
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  checked={editingBusiness ? editForm.verified : newBusiness.verified}
                  onChange={(e) => editingBusiness 
                    ? setEditForm({ ...editForm, verified: e.target.checked })
                    : setNewBusiness({ ...newBusiness, verified: e.target.checked })
                  }
                />
                <label htmlFor="verified" className="ml-2 text-sm text-gray-700">
                  Верифициран бизнес
                </label>
              </div>

              <div className="md:col-span-2 flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg transition-colors"
                >
                  {loading ? 'Обработване...' : (editingBusiness ? 'Запази промените' : 'Добави бизнес')}
                </button>
                
                <button
                  type="button"
                  onClick={editingBusiness ? cancelEdit : () => setShowAddForm(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-3 rounded-lg transition-colors"
                >
                  Отказ
                </button>
              </div>
            </form>
          </div>
        )}
        </div>

        {/* Business List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Списък с бизнеси</h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Зареждане...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Бизнес
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Категория
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Контакт
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {businesses.map((business) => (
                    <tr key={business.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{business.name}</div>
                          <div className="text-sm text-gray-500">{business.address}, {business.city}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {business.categories?.icon} {business.categories?.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{business.phone}</div>
                        <div>{business.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          business.verified 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {business.verified ? '✅ Верифициран' : '⏳ Не верифициран'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => startEdit(business)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          ✏️ Редактирай
                        </button>
                        <button
                          onClick={() => toggleVerification(business.id, business.verified)}
                          className={`${
                            business.verified ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {business.verified ? '❌ Отмени верификация' : '✅ Верифицирай'}
                        </button>
                        <button
                          onClick={() => deleteBusiness(business.id, business.name)}
                          className="text-red-600 hover:text-red-900"
                        >
                          🗑️ Изтрий
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}