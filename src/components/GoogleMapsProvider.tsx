// components/GoogleMapsProvider.tsx - Clean версия без debug
'use client'

import Script from 'next/script'
import { useState } from 'react'

interface GoogleMapsProviderProps {
  children: React.ReactNode
}

export default function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadError, setLoadError] = useState(false)

  const handleLoad = () => {
    setIsLoaded(true)
  }

  const handleError = () => {
    setLoadError(true)
  }

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`}
        strategy="beforeInteractive"
        onLoad={handleLoad}
        onError={handleError}
      />
      
      {/* Опционално: дискретен loading индикатор само когато е нужен */}
      {!isLoaded && !loadError && (
        <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-lg shadow-sm text-sm">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400"></div>
            <span>Зареждане...</span>
          </div>
        </div>
      )}
      
      {loadError && (
        <div className="fixed bottom-4 right-4 z-50 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg shadow-sm text-sm">
          ⚠️ Грешка при зареждане на картата
        </div>
      )}
      
      {children}
    </>
  )
}