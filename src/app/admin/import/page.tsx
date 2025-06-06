'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function DataImport() {
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [preview, setPreview] = useState<string[][]>([])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    
    // Preview first few rows
    const text = await selectedFile.text()
    const lines = text.split('\n').slice(0, 6) // Header + 5 rows
    const csvData = lines.map(line => line.split(','))
    setPreview(csvData)
  }

  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
      const business: any = {}
      
      headers.forEach((header, index) => {
        business[header] = values[index] || ''
      })
      
      return business
    })
  }

  const importData = async () => {
    if (!file) return

    setImporting(true)
    try {
      const text = await file.text()
      const businesses = parseCSV(text)
      
      let successCount = 0
      let errorCount = 0
      const errors: string[] = []

      for (const business of businesses) {
        try {
          // Validate required fields
          if (!business.name || !business.description) {
            errors.push(`Skipped: ${business.name || 'Unknown'} - Missing required fields`)
            errorCount++
            continue
          }

          // Find or create category
          let categoryId: number | null = null
          if (business.category) {
            const { data: existingCategory } = await supabase
              .from('categories')
              .select('id')
              .eq('name', business.category)
              .single()

            if (existingCategory) {
              categoryId = existingCategory.id
            } else {
              // Create new category
              const slug = business.category.toLowerCase()
                .replace(/[^a-z0-9\s]/g, '')
                .replace(/\s+/g, '-')
              
              const { data: newCategory } = await supabase
                .from('categories')
                .insert({
                  name: business.category,
                  slug: slug,
                  icon: getDefaultIcon(business.category)
                })
                .select('id')
                .single()

              categoryId = newCategory?.id
            }
          }

          // Insert business
          const { error } = await supabase
            .from('businesses')
            .insert({
              name: business.name,
              description: business.description,
              address: business.address || null,
              phone: business.phone || null,
              email: business.email || null,
              website: business.website || null,
              city: business.city || 'Бургас',
              category_id: categoryId,
              rating: 0,
              review_count: 0,
              verified: false
            })

          if (error) {
            errors.push(`Failed: ${business.name} - ${error.message}`)
            errorCount++
          } else {
            successCount++
          }

        } catch (err) {
          errors.push(`Error: ${business.name} - ${err}`)
          errorCount++
        }
      }

      setResults({
        total: businesses.length,
        success: successCount,
        errors: errorCount,
        errorDetails: errors
      })

    } catch (error) {
      console.error('Import error:', error)
      setResults({
        total: 0,
        success: 0,
        errors: 1,
        errorDetails: [`File processing error: ${error}`]
      })
    }
    
    setImporting(false)
  }

  const getDefaultIcon = (category: string): string => {
    const categoryIcons: { [key: string]: string } = {
      'ресторанти': '🍽️',
      'ресторант': '🍽️',
      'заведения': '🍽️',
      'храна': '🍽️',
      'кафе': '☕',
      'бар': '🍺',
      'здравеопазване': '🏥',
      'лекар': '👨‍⚕️',
      'болница': '🏥',
      'аптека': '💊',
      'стоматолог': '🦷',
      'технологии': '💻',
      'it': '💻',
      'компютри': '💻',
      'софтуер': '💻',
      'търговия': '🏪',
      'магазин': '🏪',
      'супермаркет': '🛒',
      'услуги': '🔧',
      'автосервиз': '🚗',
      'красота': '💄',
      'фризьор': '✂️',
      'ремонти': '🔨',
      'бизнес': '💼',
      'счетоводител': '📊',
      'адвокат': '⚖️',
      'консултант': '💼',
      'хотели': '🏨',
      'хотел': '🏨',
      'туризъм': '🗺️',
      'образование': '🎓',
      'училище': '🏫',
      'курсове': '📚'
    }

    const categoryLower = category.toLowerCase()
    return categoryIcons[categoryLower] || '🏢'
  }

  const downloadTemplate = () => {
    const csvContent = `name,description,address,phone,email,website,category,city
"Ресторант Нептун","Свежа риба и морски деликатеси в сърцето на Бургас","бул. Богориди 2","056 123456","info@neptun-bg.com","https://neptun-bg.com","Ресторанти","Бургас"
"ИТ Солюшънс ЕООД","Разработка на уеб сайтове и мобилни приложения","ул. Александровска 15","056 789012","contact@itsolutions.bg","https://itsolutions.bg","Технологии","Бургас"
"Дентал Клиник Бургас","Модерна стоматологична практика","ул. Васил Левски 8","056 345678","info@dentalclinic-bg.com","","Здравеопазване","Бургас"`

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'ypai_burgas_template.csv'
    link.click()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">📊 Bulk Data Import</h1>
              <p className="text-gray-600">Import multiple businesses from CSV file</p>
            </div>
            <Link
              href="/admin"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              ← Back to Admin
            </Link>
          </div>
        </div>
        
        {/* Template Download */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">📋 CSV Template</h2>
          <p className="text-blue-700 mb-3">
            Download the CSV template to see the expected format for business data import.
          </p>
          <button
            onClick={downloadTemplate}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Download CSV Template
          </button>
        </div>

        {/* File Upload */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload CSV File</h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csvFile"
            />
            <label
              htmlFor="csvFile"
              className="cursor-pointer flex flex-col items-center"
            >
              <div className="text-4xl mb-2">📄</div>
              <div className="text-lg font-medium text-gray-700">
                {file ? file.name : 'Choose CSV file'}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Click to browse or drag and drop
              </div>
            </label>
          </div>
        </div>

        {/* Preview */}
        {preview.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Preview</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {preview[0]?.map((header: string, index: number) => (
                      <th key={index} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {preview.slice(1).map((row: string[], rowIndex: number) => (
                    <tr key={rowIndex}>
                      {row.map((cell: string, cellIndex: number) => (
                        <td key={cellIndex} className="px-3 py-2 text-sm text-gray-900">
                          {cell.substring(0, 50)}{cell.length > 50 ? '...' : ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Import Button */}
        {file && (
          <div className="text-center mb-6">
            <button
              onClick={importData}
              disabled={importing}
              className={`px-8 py-3 rounded-lg text-white font-medium ${
                importing 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {importing ? 'Importing...' : 'Import Data'}
            </button>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Import Results</h2>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-blue-50 p-4 rounded">
                <div className="text-2xl font-bold text-blue-600">{results.total}</div>
                <div className="text-blue-800">Total Records</div>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <div className="text-2xl font-bold text-green-600">{results.success}</div>
                <div className="text-green-800">Successful</div>
              </div>
              <div className="bg-red-50 p-4 rounded">
                <div className="text-2xl font-bold text-red-600">{results.errors}</div>
                <div className="text-red-800">Errors</div>
              </div>
            </div>

            {results.errorDetails.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Error Details:</h3>
                <div className="bg-red-50 rounded p-4 max-h-40 overflow-y-auto">
                  {results.errorDetails.map((error: string, index: number) => (
                    <div key={index} className="text-sm text-red-700 mb-1">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
        )}
      </div>
    </div>
  )
}