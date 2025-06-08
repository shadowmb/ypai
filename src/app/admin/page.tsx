'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase, Business, Category } from '@/lib/supabase'
import Link from 'next/link'
import AddressAutocomplete, { AddressData } from '@/components/AddressAutocomplete'

export default function AdminPanel() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [showAddCategoryForm, setShowAddCategoryForm] = useState(false)
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(false)
  
  // Нови states за изтриване на категории
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [businessesToMove, setBusinessesToMove] = useState<Business[]>([])
  const [selectedTargetCategory, setSelectedTargetCategory] = useState('')

  // НОВИ STATES ЗА ТЪРСЕНЕ, СОРТИРАНЕ И ПАГИНАЦИЯ
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'status' | 'created_at'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [currentPage, setCurrentPage] = useState(1)

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
    verified: false,
    latitude: null as number | null,
    longitude: null as number | null
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
    verified: false,
    latitude: null as number | null,
    longitude: null as number | null
  })

  const [newCategory, setNewCategory] = useState({
    name: '',
    icon: ''
  })

  const [editCategoryForm, setEditCategoryForm] = useState({
    name: '',
    icon: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  // ФУНКЦИИ ЗА ФИЛТРИРАНЕ И СОРТИРАНЕ
  const filteredAndSortedBusinesses = useMemo(() => {
    let filtered = businesses

    // Търсене
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      filtered = businesses.filter(business => 
        business.name.toLowerCase().includes(search) ||
        business.address?.toLowerCase().includes(search) ||
        business.city?.toLowerCase().includes(search) ||
        business.phone?.toLowerCase().includes(search) ||
        business.email?.toLowerCase().includes(search) ||
        business.categories?.name.toLowerCase().includes(search)
      )
    }

    // Сортиране
    filtered.sort((a, b) => {
      let valueA: string | number | boolean
      let valueB: string | number | boolean

      switch (sortBy) {
        case 'name':
          valueA = a.name.toLowerCase()
          valueB = b.name.toLowerCase()
          break
        case 'category':
          valueA = a.categories?.name.toLowerCase() || ''
          valueB = b.categories?.name.toLowerCase() || ''
          break
        case 'status':
          valueA = a.verified
          valueB = b.verified
          break
        case 'created_at':
        default:
          valueA = new Date(a.created_at || '').getTime()
          valueB = new Date(b.created_at || '').getTime()
          break
      }

      if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1
      if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [businesses, searchTerm, sortBy, sortOrder])

  // Пагинация
  const totalPages = Math.ceil(filteredAndSortedBusinesses.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedBusinesses = filteredAndSortedBusinesses.slice(startIndex, startIndex + itemsPerPage)

  // Reset страницата при промяна на търсенето или items per page
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, itemsPerPage])

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  const getSortIcon = (column: typeof sortBy) => {
    if (sortBy !== column) return '↕️'
    return sortOrder === 'asc' ? '↑' : '↓'
  }

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

  // ========== BUSINESS FUNCTIONS ==========
  const addBusiness = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
  
    const { error } = await supabase
      .from('businesses')
      .insert([{
        ...newBusiness,
        category_id: parseInt(newBusiness.category_id),
        rating: 0,
        review_count: 0,
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
        verified: false,
        latitude: null,
        longitude: null
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
      verified: business.verified,
      latitude: business.latitude || null,
      longitude: business.longitude || null
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
      verified: false,
      latitude: null,
      longitude: null
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

  const handleAddressSelect = (addressData: AddressData, isEditing: boolean = false) => {
    if (isEditing) {
      setEditForm(prev => ({
        ...prev,
        address: addressData.street,
        city: addressData.city,
        latitude: addressData.latitude,
        longitude: addressData.longitude
      }))
    } else {
      setNewBusiness(prev => ({
        ...prev,
        address: addressData.street,
        city: addressData.city,
        latitude: addressData.latitude,
        longitude: addressData.longitude
      }))
    }
  }

  // ========== CATEGORY FUNCTIONS ==========
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const slug = generateSlug(newCategory.name)
    
    const { error } = await supabase
      .from('categories')
      .insert([{
        ...newCategory,
        slug: slug
      }])

    if (error) {
      alert('Грешка при добавяне на категория: ' + error.message)
    } else {
      alert('Категорията е добавена успешно!')
      setNewCategory({ name: '', icon: '' })
      setShowAddCategoryForm(false)
      loadData()
    }

    setLoading(false)
  }

  const startEditCategory = (category: Category) => {
    setEditingCategory(category)
    setEditCategoryForm({
      name: category.name,
      icon: category.icon || ''
    })
  }

  const cancelEditCategory = () => {
    setEditingCategory(null)
    setEditCategoryForm({ name: '', icon: '' })
  }

  const updateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCategory) return
    
    setLoading(true)

    const slug = generateSlug(editCategoryForm.name)

    const { error } = await supabase
      .from('categories')
      .update({
        ...editCategoryForm,
        slug: slug
      })
      .eq('id', editingCategory.id)

    if (error) {
      alert('Грешка при редакция на категория: ' + error.message)
    } else {
      alert('Категорията е редактирана успешно!')
      cancelEditCategory()
      loadData()
    }

    setLoading(false)
  }

  const initiateCategoryDelete = async (category: Category) => {
    const businessesInCategory = businesses.filter(b => b.category_id === category.id)

    if (businessesInCategory.length === 0) {
      if (confirm(`Сигурни ли сте, че искате да изтриете категорията "${category.name}"?`)) {
        await deleteCategoryDirectly(category.id, category.name)
      }
    } else {
      setCategoryToDelete(category)
      setBusinessesToMove(businessesInCategory)
      setSelectedTargetCategory('')
      setShowDeleteCategoryModal(true)
    }
  }

  const deleteCategoryDirectly = async (categoryId: number, categoryName: string) => {
    setLoading(true)
    
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId)

    if (error) {
      alert('Грешка при изтриване на категория: ' + error.message)
    } else {
      alert('Категорията е изтрита успешно!')
      loadData()
    }
    
    setLoading(false)
  }

  const confirmCategoryDelete = async () => {
    if (!categoryToDelete || !selectedTargetCategory) return
    
    setLoading(true)
    
    try {
      const { error: moveError } = await supabase
        .from('businesses')
        .update({ category_id: parseInt(selectedTargetCategory) })
        .eq('category_id', categoryToDelete.id)

      if (moveError) {
        throw moveError
      }

      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryToDelete.id)

      if (deleteError) {
        throw deleteError
      }

      alert(`Категорията "${categoryToDelete.name}" е изтрита успешно! ${businessesToMove.length} бизнеса са преместени.`)
      
      setShowDeleteCategoryModal(false)
      setCategoryToDelete(null)
      setBusinessesToMove([])
      setSelectedTargetCategory('')
      loadData()
      
    } catch (error: any) {
      alert('Грешка при изтриване на категория: ' + error.message)
    }
    
    setLoading(false)
  }

  const cancelCategoryDelete = () => {
    setShowDeleteCategoryModal(false)
    setCategoryToDelete(null)
    setBusinessesToMove([])
    setSelectedTargetCategory('')
  }

  const availableIcons = [
    '🏢', '🍽️', '🚗', '🏥', '👨‍⚕️', '🛍️', '🎓', '🔧', 
    '✂️', '🏨', '💻', '📱', '🎵', '🎬', '🎨', '📚',
    '🏋️', '⚽', '🎾', '🏊', '🚴', '🧘', '💄', '💅',
    '🍕', '🍔', '🍜', '☕', '🍺', '🍷', '🛒', '👕',
    '👠', '💍', '🏠', '🚪', '🔑', '🛠️', '⚡', '💡',
    '🌱', '🌳', '🌺', '🐕', '🐱', '🚕', '🚌', '✈️'
  ]

  const IconSelector = ({ value, onChange, placeholder = "Избери икона" }: {
    value: string
    onChange: (icon: string) => void
    placeholder?: string
  }) => {
    const [showPicker, setShowPicker] = useState(false)

    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowPicker(!showPicker)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-left flex items-center justify-between bg-white"
        >
          <span>
            {value ? (
              <span className="flex items-center">
                <span className="text-2xl mr-2">{value}</span>
                <span>Избрана икона</span>
              </span>
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
          </span>
          <span className="text-gray-400">▼</span>
        </button>

        {showPicker && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setShowPicker(false)}
            />
            
            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              <div className="grid grid-cols-8 gap-1 p-2">
                {availableIcons.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => {
                      onChange(icon)
                      setShowPicker(false)
                    }}
                    className="p-2 text-2xl hover:bg-gray-100 rounded transition-colors"
                    title={icon}
                  >
                    {icon}
                  </button>
                ))}
              </div>
              
              <div className="border-t p-2">
                <input
                  type="text"
                  placeholder="Или въведете custom емоджи..."
                  className="w-full px-2 py-1 text-sm border border-gray-200 rounded"
                  onChange={(e) => {
                    if (e.target.value) {
                      onChange(e.target.value)
                      setShowPicker(false)
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          </>
        )}
      </div>
    )
  }
  
  const findDuplicateCategories = () => {
    const seen = new Set()
    const duplicates: Category[] = []
    
    categories.forEach(category => {
      const normalizedName = category.name.toLowerCase().trim()
      if (seen.has(normalizedName)) {
        const original = categories.find(c => c.name.toLowerCase().trim() === normalizedName && !duplicates.includes(c))
        if (original && !duplicates.includes(original)) {
          duplicates.push(original)
        }
        duplicates.push(category)
      } else {
        seen.add(normalizedName)
      }
    })
    
    return duplicates
  }

  const duplicateCategories = findDuplicateCategories()

  // SEARCH & CONTROLS КОМПОНЕНТ
  const SearchAndControls = () => (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
        {/* Търсачка */}
        <div className="flex-1 min-w-0">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🔍 Търсене в бизнеси
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Търси по име, адрес, телефон, email или категория..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              🔍
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Сортиране */}
        <div className="w-full lg:w-48">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📊 Сортиране
          </label>
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [newSortBy, newSortOrder] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder]
              setSortBy(newSortBy)
              setSortOrder(newSortOrder)
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="created_at-desc">📅 Най-нови първо</option>
            <option value="created_at-asc">📅 Най-стари първо</option>
            <option value="name-asc">🔤 Име А-Я</option>
            <option value="name-desc">🔤 Име Я-А</option>
            <option value="category-asc">📂 Категория А-Я</option>
            <option value="category-desc">📂 Категория Я-А</option>
            <option value="status-desc">✅ Верифицирани първо</option>
            <option value="status-asc">⏳ Неверифицирани първо</option>
          </select>
        </div>

        {/* Items per page */}
        <div className="w-full lg:w-32">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📄 На страница
          </label>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={filteredAndSortedBusinesses.length}>Всички ({filteredAndSortedBusinesses.length})</option>
          </select>
        </div>
      </div>

      {/* Резултати информация */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-600">
        <div>
          Показване {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAndSortedBusinesses.length)} от {filteredAndSortedBusinesses.length} 
          {searchTerm && ` (филтрирани от общо ${businesses.length})`}
        </div>
        {searchTerm && (
          <div className="mt-2 sm:mt-0">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Търсене: "{searchTerm}"
            </span>
          </div>
        )}
      </div>
    </div>
  )

  // PAGINATION КОМПОНЕНТ
  const Pagination = () => {
    if (totalPages <= 1) return null

    const getPageNumbers = () => {
      const pages = []
      const showPages = 5
      
      let startPage = Math.max(1, currentPage - Math.floor(showPages / 2))
      let endPage = Math.min(totalPages, startPage + showPages - 1)
      
      if (endPage - startPage + 1 < showPages) {
        startPage = Math.max(1, endPage - showPages + 1)
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }
      
      return pages
    }

    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-700 mb-4 sm:mb-0">
            Страница {currentPage} от {totalPages}
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
                    ? 'bg-indigo-600 text-white border-indigo-600'
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
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modal за изтриване на категория */}
      {showDeleteCategoryModal && categoryToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              ⚠️ Премести бизнесите преди изтриване
            </h3>
            
            <p className="text-gray-600 mb-4">
              Категорията <strong>"{categoryToDelete.name}"</strong> съдържа {businessesToMove.length} бизнеса. 
              Моля изберете нова категория за тях:
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Нова категория за бизнесите:
              </label>
              <select
                value={selectedTargetCategory}
                onChange={(e) => setSelectedTargetCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">-- Избери категория --</option>
                {categories
                  .filter(c => c.id !== categoryToDelete.id)
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-2 mb-4 max-h-32 overflow-y-auto">
              <p className="text-sm text-gray-600">Бизнеси за преместване:</p>
              {businessesToMove.map(business => (
                <div key={business.id} className="text-sm bg-gray-100 px-2 py-1 rounded">
                  {business.name}
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={confirmCategoryDelete}
                disabled={!selectedTargetCategory || loading}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {loading ? 'Изтриване...' : 'Премести и изтрий'}
              </button>
              
              <button
                onClick={cancelCategoryDelete}
                disabled={loading}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Отказ
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🛠️ YPAI Admin Panel</h1>
              <p className="text-gray-600 mt-2">Управление на бизнеси и категории</p>
              {duplicateCategories.length > 0 && (
                <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded-lg">
                  <p className="text-red-800 text-sm">
                    ⚠️ Намерени дублирани категории: {duplicateCategories.map(c => c.name).join(', ')}
                  </p>
                </div>
              )}
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
                {duplicateCategories.length > 0 && (
                  <p className="text-sm text-red-600">({duplicateCategories.length} дублирани)</p>
                )}
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

            <button
              onClick={() => setShowCategoryManager(!showCategoryManager)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center"
            >
              {showCategoryManager ? '✕ Затвори' : '📂 Управление на категории'}
            </button>

            <Link
              href="/admin/add-wizard"
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center"
            >
              🧙‍♂️ Smart Wizard
            </Link>

            <Link
              href="/admin/import"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center"
            >
              📊 Bulk Import
            </Link>

            <Link
              href="/api-docs"
              target="_blank"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center"
            >
              📚 API Docs
            </Link>
          </div>
        </div> 

        {/* Category Manager */}
        {showCategoryManager && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">📂 Управление на категории</h2>
              <button
                onClick={() => setShowAddCategoryForm(!showAddCategoryForm)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                {showAddCategoryForm ? '✕ Затвори' : '+ Добави категория'}
              </button>
            </div>

            {/* Add/Edit Category Form */}
            {(showAddCategoryForm || editingCategory) && (
              <div className="border border-gray-200 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-medium mb-4">
                  {editingCategory ? '✏️ Редактиране на категория' : '➕ Добавяне на нова категория'}
                </h3>
                <form onSubmit={editingCategory ? updateCategory : addCategory} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Име на категорията *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      value={editingCategory ? editCategoryForm.name : newCategory.name}
                      onChange={(e) => editingCategory 
                        ? setEditCategoryForm({ ...editCategoryForm, name: e.target.value })
                        : setNewCategory({ ...newCategory, name: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Икона (емоджи)
                    </label>
                    <IconSelector
                      value={editingCategory ? editCategoryForm.icon : newCategory.icon}
                      onChange={(icon) => editingCategory 
                        ? setEditCategoryForm({ ...editCategoryForm, icon })
                        : setNewCategory({ ...newCategory, icon })
                      }
                      placeholder="Избери икона за категорията"
                    />
                  </div>

                  <div className="flex items-end gap-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                      {loading ? 'Обработване...' : (editingCategory ? 'Запази' : 'Добави')}
                    </button>
                    
                    <button
                      type="button"
                      onClick={editingCategory ? cancelEditCategory : () => setShowAddCategoryForm(false)}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                      Отказ
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Categories List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => {
                const businessCount = businesses.filter(b => b.category_id === category.id).length
                const isDuplicate = duplicateCategories.some(d => d.id === category.id)
                
                return (
                  <div key={category.id} className={`border rounded-lg p-4 ${isDuplicate ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{category.icon}</span>
                          <span className="font-medium">{category.name}</span>
                          {isDuplicate && <span className="text-red-500">⚠️</span>}
                        </div>
                        <p className="text-sm text-gray-500">{businessCount} бизнеса</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 text-sm">
                      <button
                        onClick={() => startEditCategory(category)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ✏️ Редактирай
                      </button>
                      <button
                        onClick={() => initiateCategoryDelete(category)}
                        className="text-red-600 hover:text-red-800"
                      >
                        🗑️ Изтрий {businessCount > 0 && `(${businessCount})`}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

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

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📍 Адрес *
                </label>
                <AddressAutocomplete
                  onAddressSelect={(addressData) => handleAddressSelect(addressData, !!editingBusiness)}
                  defaultValue={editingBusiness ? `${editForm.address}, ${editForm.city}` : `${newBusiness.address}, ${newBusiness.city}`}
                  placeholder="Въведете адрес (напр. бул. Витоша 1, София)"
                  className="w-full"
                />
                
                {/* GPS координати индикатор */}
                {((editingBusiness && editForm.latitude) || (!editingBusiness && newBusiness.latitude)) && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700 flex items-center">
                      <span className="mr-2">✅</span>
                      GPS координати записани: {' '}
                      <span className="font-mono text-xs ml-1">
                        {editingBusiness 
                          ? `${editForm.latitude?.toFixed(6)}, ${editForm.longitude?.toFixed(6)}`
                          : `${newBusiness.latitude?.toFixed(6)}, ${newBusiness.longitude?.toFixed(6)}`
                        }
                      </span>
                    </p>
                  </div>
                )}
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

        {/* Search & Controls */}
        <SearchAndControls />

        {/* Business List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Списък с бизнеси
              {searchTerm && <span className="text-blue-600 ml-2">({filteredAndSortedBusinesses.length} резултата)</span>}
            </h2>
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
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Бизнес</span>
                        <span className="text-sm">{getSortIcon('name')}</span>
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('category')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Категория</span>
                        <span className="text-sm">{getSortIcon('category')}</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Контакт
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Статус</span>
                        <span className="text-sm">{getSortIcon('status')}</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedBusinesses.map((business) => (
                    <tr key={business.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{business.name}</div>
                          <div className="text-sm text-gray-500 flex items-center">
                            {business.address}, {business.city}
                            {business.latitude && business.longitude && (
                              <span className="ml-2 text-green-500" title="GPS координати налични">📍</span>
                            )}
                          </div>
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

        {/* Pagination */}
        <Pagination />
      </div>
    </div>
  )
}