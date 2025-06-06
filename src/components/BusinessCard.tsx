import { Business } from '@/lib/supabase'

interface BusinessCardProps {
  business: Business
}

export default function BusinessCard({ business }: BusinessCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-bold text-xl text-indigo-600 mb-2">{business.name}</h3>
        {business.verified && (
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
            ✓ Verified
          </span>
        )}
      </div>
      
      {business.description && (
        <p className="text-gray-600 text-sm mb-4">{business.description}</p>
      )}
      
      <div className="space-y-2 text-sm text-gray-700">
        {business.address && (
          <div className="flex items-center">
            <span className="mr-2">📍</span>
            <span>{business.address}, {business.city}</span>
          </div>
        )}
        
        {business.phone && (
          <div className="flex items-center">
            <span className="mr-2">📞</span>
            <span>{business.phone}</span>
          </div>
        )}
        
        {business.website && (
          <div className="flex items-center">
            <span className="mr-2">🌐</span>
            <a href={`https://${business.website}`} target="_blank" rel="noopener noreferrer" 
               className="text-blue-600 hover:underline">
              {business.website}
            </a>
          </div>
        )}
        
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center">
            <span className="mr-2">⭐</span>
            <span className="font-medium">{business.rating}/5</span>
            <span className="text-gray-500 ml-1">({business.review_count} отзива)</span>
          </div>
        </div>
      </div>
    </div>
  )
}