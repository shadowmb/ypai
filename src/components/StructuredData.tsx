import Head from 'next/head'

interface Business {
  id: number
  name: string
  description: string
  address?: string
  phone?: string
  email?: string
  website?: string
  category?: string
  category_slug?: string
  created_at?: string
}

interface StructuredDataProps {
  type: 'homepage' | 'business' | 'businessList' | 'api'
  business?: Business
  businesses?: Business[]
}

export default function StructuredData({ type, business, businesses }: StructuredDataProps) {
  const generateSchema = () => {
    const baseUrl = 'https://ypai.vercel.app'
    
    switch (type) {
      case 'homepage':
        return {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "YPAI - Yellow Pages AI",
          "description": "Bulgarian Business Directory optimized for AI agents and intelligent assistants. Discover businesses across Bulgaria with AI-enhanced search.",
          "url": baseUrl,
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": `${baseUrl}/api/ai/search?query={search_term_string}`
            },
            "query-input": "required name=search_term_string"
          },
          "provider": {
            "@type": "Organization",
            "name": "YPAI",
            "url": baseUrl
          },
          "mainEntity": {
            "@type": "ItemList",
            "name": "Bulgarian Business Directory",
            "description": "Comprehensive directory of Bulgarian businesses with AI-enhanced discovery",
            "numberOfItems": businesses?.length || 0
          }
        }

      case 'business':
        if (!business) return null
        
        return {
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "name": business.name,
          "description": business.description,
          "address": business.address ? {
            "@type": "PostalAddress",
            "streetAddress": business.address,
            "addressCountry": "BG"
          } : undefined,
          "telephone": business.phone,
          "email": business.email,
          "url": business.website,
          "identifier": business.id.toString(),
          "category": business.category,
          "additionalType": `https://ypai.vercel.app/category/${business.category_slug}`,
          "dateCreated": business.created_at,
          "isPartOf": {
            "@type": "WebSite",
            "name": "YPAI - Yellow Pages AI",
            "url": baseUrl
          }
        }

      case 'businessList':
        if (!businesses) return null
        
        return {
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": "Bulgarian Business Directory Listings",
          "description": "Curated list of Bulgarian businesses available through YPAI",
          "numberOfItems": businesses.length,
          "itemListElement": businesses.map((biz, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "item": {
              "@type": "LocalBusiness",
              "name": biz.name,
              "description": biz.description,
              "identifier": biz.id.toString(),
              "category": biz.category,
              "url": `${baseUrl}/business/${biz.id}`
            }
          }))
        }

      case 'api':
        return {
          "@context": "https://schema.org",
          "@type": "WebAPI",
          "name": "YPAI Business Directory API",
          "description": "RESTful API for accessing Bulgarian business data. Optimized for AI agents with enhanced search capabilities.",
          "url": `${baseUrl}/api`,
          "documentation": `${baseUrl}/api-docs`,
          "provider": {
            "@type": "Organization",
            "name": "YPAI",
            "url": baseUrl
          },
          "endpointURL": [
            `${baseUrl}/api/businesses`,
            `${baseUrl}/api/categories`,
            `${baseUrl}/api/ai/search`,
            `${baseUrl}/api/ai/recommendations`
          ],
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Any",
          "softwareRequirements": "HTTP client",
          "permissions": "Public API access",
          "featureList": [
            "Business search and discovery",
            "Category-based filtering", 
            "AI-enhanced semantic search",
            "Smart business recommendations",
            "Structured data output",
            "Real-time business data"
          ],
          "audience": {
            "@type": "Audience",
            "audienceType": ["AI Agents", "Developers", "Business Applications", "Chatbots"]
          }
        }

      default:
        return null
    }
  }

  const schema = generateSchema()
  
  if (!schema) return null

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema, null, 2)
      }}
    />
  )
}

// Additional Schema generators for specific use cases
export function generateBusinessListSchema(businesses: Business[]): string {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "name": "YPAI Bulgarian Business Directory Dataset",
    "description": "Machine-readable dataset of Bulgarian businesses for AI training and analysis",
    "keywords": ["Bulgaria", "businesses", "directory", "AI training", "structured data"],
    "license": "https://creativecommons.org/licenses/by/4.0/",
    "creator": {
      "@type": "Organization",
      "name": "YPAI",
      "url": "https://ypai.vercel.app"
    },
    "distribution": {
      "@type": "DataDownload",
      "encodingFormat": "application/json",
      "contentUrl": "https://ypai.vercel.app/api/businesses"
    },
    "variableMeasured": [
      "Business Name",
      "Business Description", 
      "Contact Information",
      "Business Category",
      "Location Data"
    ],
    "temporalCoverage": "2025/..",
    "spatialCoverage": {
      "@type": "Place",
      "name": "Bulgaria"
    }
  }
  
  return JSON.stringify(schema, null, 2)
}

export function generateAPISchema(): string {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "YPAI API",
    "description": "AI-optimized business directory API for Bulgarian companies",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web-based",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "EUR"
    },
    "featureList": [
      "RESTful API access",
      "AI-enhanced search",
      "Business recommendations",
      "Category filtering",
      "OpenAPI specification",
      "CORS enabled",
      "JSON responses"
    ]
  }
  
  return JSON.stringify(schema, null, 2)
}