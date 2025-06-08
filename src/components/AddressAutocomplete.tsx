// components/AddressAutocomplete.tsx - Production готов компонент
'use client'

import { useState, useEffect, useRef } from 'react'

declare global {
  interface Window {
    google: typeof google
  }
}

export interface AddressData {
  street: string
  city: string
  latitude: number
  longitude: number
  fullAddress: string
}

interface AddressAutocompleteProps {
  onAddressSelect: (addressData: AddressData) => void
  defaultValue?: string
  placeholder?: string
  className?: string
}

export default function AddressAutocomplete({
  onAddressSelect,
  defaultValue = '',
  placeholder = 'Въведете адрес...',
  className = ''
}: AddressAutocompleteProps) {
  const [input, setInput] = useState(defaultValue)
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isGoogleReady, setIsGoogleReady] = useState(false)
  
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null)
  const placesService = useRef<google.maps.places.PlacesService | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkGoogleMaps = () => {
      if (typeof window !== 'undefined' && window.google?.maps) {
        initializeServices()
      } else {
        setTimeout(checkGoogleMaps, 100)
      }
    }

    checkGoogleMaps()
  }, [])

  const initializeServices = () => {
    try {
      // AutocompleteService за търсене
      if (window.google.maps.places?.AutocompleteService) {
        autocompleteService.current = new window.google.maps.places.AutocompleteService()
      }
      
      // PlacesService за детайли
      if (mapRef.current && window.google.maps.places?.PlacesService) {
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: 42.6977, lng: 23.3219 }, // София
          zoom: 13
        })
        placesService.current = new window.google.maps.places.PlacesService(map)
        setIsGoogleReady(true)
      }
    } catch (error) {
      console.error('Google Maps initialization error:', error)
    }
  }

  const searchPlaces = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    if (!autocompleteService.current) return

    setIsLoading(true)

    try {
      const request: google.maps.places.AutocompletionRequest = {
        input: query,
        componentRestrictions: { country: 'bg' },
        types: ['address'],
        language: 'bg'
      }

      autocompleteService.current.getPlacePredictions(
        request,
        (predictions: google.maps.places.AutocompletePrediction[] | null, status: google.maps.places.PlacesServiceStatus) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions)
            setShowSuggestions(true)
          } else {
            setSuggestions([])
            setShowSuggestions(false)
          }
          setIsLoading(false)
        }
      )
    } catch (error) {
      console.error('Search error:', error)
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInput(value)
    
    // Debounce
    const timeoutId = setTimeout(() => {
      searchPlaces(value)
    }, 300)

    return () => clearTimeout(timeoutId)
  }

  const selectSuggestion = (prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesService.current) return

    const request: google.maps.places.PlaceDetailsRequest = {
      placeId: prediction.place_id,
      fields: ['geometry', 'formatted_address', 'address_components', 'name']
    }

    placesService.current.getDetails(
      request, 
      (place: google.maps.places.PlaceResult | null, status: google.maps.places.PlacesServiceStatus) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
          const location = place.geometry.location
          const lat = location.lat()
          const lng = location.lng()
          
          // Извличане на града
          let city = 'София'
          if (place.address_components) {
            const cityComponent = place.address_components.find(
              (component) => 
                component.types.includes('locality') || 
                component.types.includes('administrative_area_level_1')
            )
            if (cityComponent) {
              city = cityComponent.long_name
            }
          }

          const street = prediction.structured_formatting?.main_text || place.name || ''

          const addressData: AddressData = {
            street,
            city,
            latitude: lat,
            longitude: lng,
            fullAddress: place.formatted_address || prediction.description
          }
          
          setInput(prediction.description)
          setSuggestions([])
          setShowSuggestions(false)
          onAddressSelect(addressData)
        }
      }
    )
  }

  return (
    <div className={`relative ${className}`}>
      {/* Hidden map container */}
      <div ref={mapRef} style={{ display: 'none', height: '1px', width: '1px' }} />
      
      {/* Input поле */}
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder={isGoogleReady ? placeholder : 'Зареждане на Google Maps...'}
          disabled={!isGoogleReady}
          className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors ${className}`}
          onFocus={() => {
            if (input.length >= 3 && suggestions.length > 0) {
              setShowSuggestions(true)
            }
          }}
        />
        
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
          </div>
        )}
      </div>

      {/* Autocomplete suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <>
          {/* Overlay за затваряне */}
          <div className="fixed inset-0 z-10" onClick={() => setShowSuggestions(false)} />
          
          {/* Dropdown с предложения */}
          <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.place_id}
                type="button"
                onClick={() => selectSuggestion(suggestion)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="font-medium text-gray-900">
                  {suggestion.structured_formatting?.main_text}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {suggestion.structured_formatting?.secondary_text}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}