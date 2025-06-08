// components/BusinessCard.tsx - Enhanced версия базирана на оригинала
import { Business } from '@/types'

interface BusinessCardProps {
  business: Business
  viewMode?: 'grid' | 'list'
}

export default function BusinessCard({ 
  business, 
  viewMode = 'grid' 
}: BusinessCardProps) {
  
  const handleCall = () => {
    if (business.phone) {
      window.location.href = `tel:${business.phone}`
    }
  }

  const handleEmail = () => {
    if (business.email) {
      window.location.href = `mailto:${business.email}`
    }
  }

  const handleWebsite = () => {
    if (business.website) {
      let url = business.website
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url
      }
      window.open(url, '_blank')
    }
  }

  const handleDirections = () => {
    if (business.latitude && business.longitude) {
      // Google Maps с координати
      const url = `https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`
      window.open(url, '_blank')
    } else if (business.address && business.city) {
      // Google Maps с адрес
      const address = encodeURIComponent(`${business.address}, ${business.city}`)
      const url = `https://www.google.com/maps/search/?api=1&query=${address}`
      window.open(url, '_blank')
    }
  }

  // GRID VIEW (базиран на оригинала, но подобрен)
  if (viewMode === 'grid') {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
        {/* Header с категория икона */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{business.category?.icon || '🏢'}</span>
            <h3 className="font-bold text-xl text-indigo-600">{business.name}</h3>
          </div>
          {business.verified && (
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
              ✓ Verified
            </span>
          )}
        </div>
        
        {/* Категория badge */}
        {business.category && (
          <div className="mb-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {business.category.name}
            </span>
          </div>
        )}
        
        {business.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">{business.description}</p>
        )}
        
        <div className="space-y-2 text-sm text-gray-700 mb-4">
          {business.address && (
            <div className="flex items-start">
              <span className="mr-2 mt-0.5">📍</span>
              <div>
                <span>{business.address}, {business.city}</span>
                {business.latitude && business.longitude && (
                  <div className="text-xs text-green-600 mt-1">
                    ✅ GPS координати налични
                  </div>
                )}
              </div>
            </div>
          )}
          
          {business.phone && (
            <div className="flex items-center">
              <span className="mr-2">📞</span>
              <span>{business.phone}</span>
            </div>
          )}

          {business.email && (
            <div className="flex items-center">
              <span className="mr-2">✉️</span>
              <span className="truncate">{business.email}</span>
            </div>
          )}
          
          {business.website && (
            <div className="flex items-center">
              <span className="mr-2">🌐</span>
              <span className="text-blue-600 hover:underline cursor-pointer truncate" onClick={handleWebsite}>
                {business.website}
              </span>
            </div>
          )}
        </div>

        {/* Rating - подобрена версия */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 mb-4">
          <div className="flex items-center">
            <span className="mr-2">⭐</span>
            <span className="font-medium">{business.rating}/5</span>
            <span className="text-gray-500 ml-1">({business.review_count} отзива)</span>
          </div>
        </div>

        {/* Action Buttons - НОВ РАЗДЕЛ */}
        <div className="grid grid-cols-2 gap-2">
          {business.phone && (
            <button
              onClick={handleCall}
              className="flex items-center justify-center space-x-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              <span>📞</span>
              <span>Обади се</span>
            </button>
          )}

          <button
            onClick={handleDirections}
            className="flex items-center justify-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            <span>🗺️</span>
            <span>Маршрут</span>
          </button>

          {business.email && (
            <button
              onClick={handleEmail}
              className="flex items-center justify-center space-x-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              <span>✉️</span>
              <span>Email</span>
            </button>
          )}

          {business.website && (
            <button
              onClick={handleWebsite}
              className="flex items-center justify-center space-x-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              <span>🌐</span>
              <span>Сайт</span>
            </button>
          )}
        </div>
      </div>
    )
  }

  // LIST VIEW (хorizontален, компактен)
  return (
    <div className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
        {/* Left side - Main Info */}
        <div className="flex-1 min-w-0 md:mr-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-xl">{business.category?.icon || '🏢'}</span>
              <div>
                <h3 className="font-bold text-lg text-indigo-600 truncate">{business.name}</h3>
                {business.category && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                    {business.category.name}
                  </span>
                )}
              </div>
            </div>
            {business.verified && (
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap">
                ✓ Verified
              </span>
            )}
          </div>

          {business.description && (
            <p className="text-gray-600 text-sm mb-2 line-clamp-2">{business.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700">
            {business.address && (
              <span className="flex items-center">
                <span className="mr-1">📍</span>
                {business.address}, {business.city}
                {business.latitude && business.longitude && (
                  <span className="ml-1 text-green-600">✅</span>
                )}
              </span>
            )}
            
            {business.phone && (
              <span className="flex items-center">
                <span className="mr-1">📞</span>
                {business.phone}
              </span>
            )}

            <span className="flex items-center">
              <span className="mr-1">⭐</span>
              <span className="font-medium">{business.rating}/5</span>
              <span className="text-gray-500 ml-1">({business.review_count})</span>
            </span>
          </div>
        </div>

        {/* Right side - Action Buttons */}
        <div className="flex space-x-2 md:flex-col md:space-x-0 md:space-y-2">
          <div className="flex space-x-2">
            {business.phone && (
              <button
                onClick={handleCall}
                className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                <span>📞</span>
                <span className="hidden sm:inline">Обади се</span>
              </button>
            )}

            <button
              onClick={handleDirections}
              className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              <span>🗺️</span>
              <span className="hidden sm:inline">Маршрут</span>
            </button>
          </div>

          <div className="flex space-x-2">
            {business.email && (
              <button
                onClick={handleEmail}
                className="flex items-center space-x-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                <span>✉️</span>
                <span className="hidden sm:inline">Email</span>
              </button>
            )}

            {business.website && (
              <button
                onClick={handleWebsite}
                className="flex items-center space-x-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                <span>🌐</span>
                <span className="hidden sm:inline">Сайт</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}