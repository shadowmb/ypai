'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

// Note: These components would need to be imported from separate files
// For now, they're defined inline for the complete wizard

// Simplified validation components for the demo
interface FieldValidation {
  isValid: boolean
  message?: string
  isRequired: boolean
}

const ValidationError = ({ validation }: { validation?: FieldValidation }) => {
  if (!validation || validation.isValid) return null
  return (
    <div className="text-red-600 text-sm mt-1 flex items-center">
      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      {validation.message}
    </div>
  )
}

const RequiredIndicator = ({ isRequired }: { isRequired?: boolean }) => {
  if (!isRequired) return null
  return <span className="text-red-500 ml-1">*</span>
}

// Simplified Working Hours Picker
const WorkingHoursPicker = ({ value, onChange }: { value: any, onChange: (hours: any) => void }) => {
  const days = ['Понеделник', 'Вторник', 'Сряда', 'Четвъртък', 'Петък', 'Събота', 'Неделя']
  
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="flex flex-wrap gap-2 mb-3">
        <button
          type="button"
          onClick={() => onChange({ standard: 'Пн-Пт: 09:00-17:00, Сб-Нд: затворено' })}
          className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200"
        >
          📅 Стандартно работно време
        </button>
        <button
          type="button"
          onClick={() => onChange({ all_day: '24/7' })}
          className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm hover:bg-green-200"
        >
          🕒 24/7
        </button>
      </div>
      <textarea
        rows={3}
        value={typeof value === 'object' ? Object.values(value)[0] : value || ''}
        onChange={(e) => onChange({ custom: e.target.value })}
        placeholder="Пн-Пт: 09:00-17:00&#10;Сб: 09:00-14:00&#10;Нд: затворено"
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}

// Simplified Phone Input
const PhoneInput = ({ value, onChange }: { value: string, onChange: (phone: string) => void }) => {
  return (
    <div className="flex">
      <div className="flex items-center px-3 py-2 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50">
        <span className="text-lg">🇧🇬</span>
        <span className="ml-2 text-sm font-medium text-gray-700">+359</span>
      </div>
      <input
        type="tel"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="88 123 4567"
        className="flex-1 px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  )
}

// Simplified Custom Services Input
const CustomServicesInput = ({ 
  options, 
  value, 
  onChange, 
  label 
}: { 
  options: string[], 
  value: string[], 
  onChange: (services: string[]) => void, 
  label: string 
}) => {
  const [customService, setCustomService] = useState('')
  const [isAddingCustom, setIsAddingCustom] = useState(false)

  const handleToggleService = (service: string) => {
    if (value.includes(service)) {
      onChange(value.filter(s => s !== service))
    } else {
      onChange([...value, service])
    }
  }

  const handleAddCustomService = () => {
    if (customService.trim() && !value.includes(customService.trim())) {
      onChange([...value, customService.trim()])
      setCustomService('')
      setIsAddingCustom(false)
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      
      {/* Selected Services */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-lg">
          {value.map(service => (
            <span
              key={service}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
            >
              {service}
              <button
                type="button"
                onClick={() => onChange(value.filter(s => s !== service))}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Available Services */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {options.filter(option => !value.includes(option)).map(option => (
          <button
            key={option}
            type="button"
            onClick={() => handleToggleService(option)}
            className="px-3 py-2 text-left text-sm border border-gray-200 rounded hover:bg-gray-50 hover:border-blue-300"
          >
            + {option}
          </button>
        ))}
      </div>

      {/* Add Custom Service */}
      {!isAddingCustom ? (
        <button
          type="button"
          onClick={() => setIsAddingCustom(true)}
          className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600"
        >
          ✨ Добави своя услуга
        </button>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={customService}
            onChange={(e) => setCustomService(e.target.value)}
            placeholder="Нова услуга..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && handleAddCustomService()}
            autoFocus
          />
          <button
            type="button"
            onClick={handleAddCustomService}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            ✓
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAddingCustom(false)
              setCustomService('')
            }}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}

// Enhanced category templates
const categoryTemplates: { [key: string]: any } = {
  'ресторанти': {
    categoryName: 'Ресторанти',
    icon: '🍽️',
    fields: [
      {
        name: 'cuisine_type',
        label: 'Тип кухня',
        type: 'select',
        required: true,
        options: ['Българска', 'Итальянска', 'Азиатска', 'Международна', 'Fast Food', 'Морски деликатеси']
      },
      {
        name: 'price_range',
        label: 'Ценова категория',
        type: 'select',
        required: true,
        options: ['$ (до 20лв)', '$$ (20-40лв)', '$$$ (40-80лв)', '$$$$ (над 80лв)']
      },
      {
        name: 'services',
        label: 'Услуги',
        type: 'multi-select-custom',
        required: false,
        options: ['Доставка', 'Резервации', 'Събитийно обслужване', 'Външна тераса', 'Паркинг', 'Детска зона']
      },
      {
        name: 'specialties',
        label: 'Специалитети',
        type: 'textarea',
        required: false,
        placeholder: 'Мусака, Пърженка, Риба на скара...'
      }
    ]
  },
  'фризьорски_салони': {
    categoryName: 'Фризьорски салони',
    icon: '✂️',
    fields: [
      {
        name: 'services',
        label: 'Услуги',
        type: 'multi-select-custom',
        required: true,
        options: ['Подстригване жени', 'Подстригване мъже', 'Боядисване', 'Къдрене', 'Изправяне', 'Маски']
      },
      {
        name: 'specialists',
        label: 'Специалисти',
        type: 'textarea',
        required: false,
        placeholder: 'Мария - стилист\nПетър - колорист'
      }
    ]
  },
  'хотели': {
    categoryName: 'Хотели',
    icon: '🏨',
    fields: [
      {
        name: 'star_rating',
        label: 'Категория звезди',
        type: 'select',
        required: true,
        options: ['1 звезда', '2 звезди', '3 звезди', '4 звезди', '5 звезди']
      },
      {
        name: 'room_types',
        label: 'Типове стаи',
        type: 'multi-select-custom',
        required: true,
        options: ['Единична', 'Двойна', 'Апартамент', 'Луксозна', 'Семейна']
      }
    ]
  },
  'default': {
    categoryName: 'Общ бизнес',
    icon: '🏢',
    fields: [
      {
        name: 'services',
        label: 'Услуги',
        type: 'multi-select-custom',
        required: false,
        options: ['Консултации', 'Ремонти', 'Доставка', 'Монтаж']
      }
    ]
  }
}

function getTemplateForCategory(categorySlug: string) {
  return categoryTemplates[categorySlug] || categoryTemplates['default']
}

export default function EnhancedSmartWizard() {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({})

  const [businessData, setBusinessData] = useState<any>({
    name: '',
    description: '',
    address: '',
    city: 'Бургас',
    phone: '',
    email: '',
    website: '',
    working_hours: {},
    custom_fields: {}
  })

  const categories = [
    { name: 'Ресторанти', slug: 'ресторанти', icon: '🍽️', id: 1 },
    { name: 'Фризьорски салони', slug: 'фризьорски_салони', icon: '✂️', id: 2 },
    { name: 'Хотели', slug: 'хотели', icon: '🏨', id: 3 },
    { name: 'Автосервизи', slug: 'автосервизи', icon: '🚗', id: 4 },
    { name: 'Лекари', slug: 'лекари', icon: '👨‍⚕️', id: 5 },
    { name: 'Други', slug: 'default', icon: '🏢', id: 6 }
  ]

  const updateBusinessData = (updates: any) => {
    setBusinessData((prev: any) => ({ ...prev, ...updates }))
  }

  const updateCustomField = (fieldName: string, value: any) => {
    setBusinessData((prev: any) => ({
      ...prev,
      custom_fields: {
        ...prev.custom_fields,
        [fieldName]: value
      }
    }))
  }

  const validateStep = (stepIndex: number): boolean => {
    const errors: { [key: string]: string } = {}
    
    switch (stepIndex) {
      case 0:
        if (!selectedCategory) {
          errors.category = 'Моля, изберете категория'
          return false
        }
        break
      case 1:
        if (!businessData.name.trim()) {
          errors.name = 'Името е задължително'
        }
        if (!businessData.working_hours || Object.keys(businessData.working_hours).length === 0) {
          errors.working_hours = 'Работното време е задължително'
        }
        break
      case 2:
        const template = getTemplateForCategory(selectedCategory)
        template.fields.forEach((field: any) => {
          if (field.required) {
            const value = businessData.custom_fields[field.name]
            if (!value || (Array.isArray(value) && value.length === 0)) {
              errors[field.name] = `${field.label} е задължително`
            }
          }
        })
        break
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const renderCustomField = (field: any) => {
    const value = businessData.custom_fields[field.name] || ''
    const hasError = validationErrors[field.name]

    switch (field.type) {
      case 'select':
        return (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              <RequiredIndicator isRequired={field.required} />
            </label>
            <select
              value={value}
              onChange={(e) => updateCustomField(field.name, e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                hasError ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Избери {field.label.toLowerCase()}</option>
              {field.options?.map((option: string) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {hasError && <div className="text-red-600 text-sm mt-1">{hasError}</div>}
          </div>
        )

      case 'multi-select-custom':
        return (
          <div key={field.name}>
            <CustomServicesInput
              options={field.options || []}
              value={Array.isArray(value) ? value : []}
              onChange={(services) => updateCustomField(field.name, services)}
              label={`${field.label}${field.required ? ' *' : ''}`}
            />
            {hasError && <div className="text-red-600 text-sm mt-1">{hasError}</div>}
          </div>
        )

      case 'textarea':
        return (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              <RequiredIndicator isRequired={field.required} />
            </label>
            <textarea
              rows={3}
              value={value}
              onChange={(e) => updateCustomField(field.name, e.target.value)}
              placeholder={field.placeholder}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                hasError ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {hasError && <div className="text-red-600 text-sm mt-1">{hasError}</div>}
          </div>
        )

      default:
        return (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              <RequiredIndicator isRequired={field.required} />
            </label>
            <input
              type={field.type === 'url' ? 'url' : 'text'}
              value={value}
              onChange={(e) => updateCustomField(field.name, e.target.value)}
              placeholder={field.placeholder}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                hasError ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {hasError && <div className="text-red-600 text-sm mt-1">{hasError}</div>}
          </div>
        )
    }
  }

  const steps = [
    // Step 1: Category Selection
    {
      title: "Избери тип бизнес",
      description: "Какъв тип бизнес добавяте?",
      component: (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map(category => (
              <button
                key={category.slug}
                onClick={() => {
                  setSelectedCategory(category.slug)
                  setSelectedCategoryId(category.id)
                }}
                className={`p-6 border-2 rounded-lg text-center transition-all ${
                  selectedCategory === category.slug
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-4xl mb-2">{category.icon}</div>
                <div className="font-medium">{category.name}</div>
              </button>
            ))}
          </div>
          {validationErrors.category && (
            <div className="text-red-600 text-sm mt-4 text-center">{validationErrors.category}</div>
          )}
        </div>
      )
    },

    // Step 2: Basic Info
    {
      title: "Основна информация",
      description: "Въведете основните данни за бизнеса",
      component: (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Име на бизнеса
              <RequiredIndicator isRequired={true} />
            </label>
            <input
              type="text"
              value={businessData.name}
              onChange={(e) => updateBusinessData({ name: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                validationErrors.name ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {validationErrors.name && <div className="text-red-600 text-sm mt-1">{validationErrors.name}</div>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Описание</label>
            <textarea
              rows={3}
              value={businessData.description}
              onChange={(e) => updateBusinessData({ description: e.target.value })}
              placeholder="Кратко описание на бизнеса..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Работно време
              <RequiredIndicator isRequired={true} />
            </label>
            <WorkingHoursPicker
              value={businessData.working_hours}
              onChange={(hours) => updateBusinessData({ working_hours: hours })}
            />
            {validationErrors.working_hours && (
              <div className="text-red-600 text-sm mt-1">{validationErrors.working_hours}</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Адрес</label>
              <input
                type="text"
                value={businessData.address}
                onChange={(e) => updateBusinessData({ address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Телефон</label>
              <PhoneInput
                value={businessData.phone}
                onChange={(phone) => updateBusinessData({ phone })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={businessData.email}
                onChange={(e) => updateBusinessData({ email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Уебсайт</label>
              <input
                type="url"
                value={businessData.website}
                onChange={(e) => updateBusinessData({ website: e.target.value })}
                placeholder="https://example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )
    },

    // Step 3: Category-specific fields
    {
      title: "Специфична информация",
      description: `Допълнителни данни за ${selectedCategory ? getTemplateForCategory(selectedCategory).categoryName.toLowerCase() : 'бизнеса'}`,
      component: selectedCategory ? (
        <div className="space-y-6">
          {getTemplateForCategory(selectedCategory).fields.map((field: any) => renderCustomField(field))}
        </div>
      ) : <div>Моля, изберете категория първо.</div>
    },

    // Step 4: Review
    {
      title: "Преглед и потвърждение",
      description: "Прегледайте данните преди запазване",
      component: (
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Основна информация:</h3>
            <p><strong>Име:</strong> {businessData.name}</p>
            <p><strong>Категория:</strong> {selectedCategory ? getTemplateForCategory(selectedCategory).categoryName : ''}</p>
            <p><strong>Адрес:</strong> {businessData.address}</p>
            <p><strong>Телефон:</strong> {businessData.phone}</p>
            <p><strong>Email:</strong> {businessData.email}</p>
            <p><strong>Уебсайт:</strong> {businessData.website}</p>
            <p><strong>Работно време:</strong> {typeof businessData.working_hours === 'object' ? Object.values(businessData.working_hours)[0] : businessData.working_hours}</p>
          </div>

          {Object.keys(businessData.custom_fields).length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Специфична информация:</h3>
              {Object.entries(businessData.custom_fields).map(([key, value]) => (
                <p key={key}>
                  <strong>{key.replace(/_/g, ' ')}:</strong> {Array.isArray(value) ? value.join(', ') : String(value)}
                </p>
              ))}
            </div>
          )}
        </div>
      )
    }
  ]

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const saveBusiness = async () => {
    if (!selectedCategoryId) {
      alert('Моля, изберете категория!')
      return
    }

    setLoading(true)
    try {
      // Format working hours for database
      const formattedWorkingHours = typeof businessData.working_hours === 'object' 
        ? Object.values(businessData.working_hours)[0] 
        : businessData.working_hours

      const { error } = await supabase
        .from('businesses')
        .insert({
          name: businessData.name,
          description: businessData.description || null,
          address: businessData.address || null,
          city: businessData.city || 'Бургас',
          phone: businessData.phone || null,
          email: businessData.email || null,
          website: businessData.website || null,
          working_hours: formattedWorkingHours || null,
          category_id: selectedCategoryId,
          custom_fields: businessData.custom_fields,
          rating: 0,
          review_count: 0,
          verified: false
        })

      if (error) {
        alert('Грешка при запазване: ' + error.message)
      } else {
        alert('Бизнесът е запазен успешно!')
        // Reset form
        setCurrentStep(0)
        setSelectedCategory('')
        setSelectedCategoryId(null)
        setBusinessData({
          name: '',
          description: '',
          address: '',
          city: 'Бургас',
          phone: '',
          email: '',
          website: '',
          working_hours: {},
          custom_fields: {}
        })
        setValidationErrors({})
      }
    } catch (err) {
      alert('Грешка: ' + err)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">🧙‍♂️ Smart Business Wizard v2.0</h1>
              <p className="text-gray-600">Интелигентно добавяне на бизнес с персонализирани полета</p>
            </div>
            <Link
              href="/admin"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              ← Back to Admin
            </Link>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Стъпка {currentStep + 1} от {steps.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(((currentStep + 1) / steps.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Current Step */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {steps[currentStep].title}
            </h1>
            <p className="text-gray-600">
              {steps[currentStep].description}
            </p>
          </div>

          <div className="mb-8">
            {steps[currentStep].component}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`px-6 py-2 rounded-lg ${
                currentStep === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-500 text-white hover:bg-gray-600'
              }`}
            >
              ← Назад
            </button>

            {currentStep === steps.length - 1 ? (
              <button
                onClick={saveBusiness}
                disabled={loading}
                className={`px-8 py-2 rounded-lg ${
                  loading
                    ? 'bg-gray-400 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {loading ? 'Запазване...' : '💾 Запази бизнеса'}
              </button>
            ) : (
              <button
                onClick={nextStep}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Напред →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}