'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

// Category templates (embedded for now)
interface FieldDefinition {
  name: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'select' | 'multi-select' | 'file' | 'json' | 'boolean' | 'time' | 'url'
  required: boolean
  placeholder?: string
  options?: string[]
  description?: string
}

interface CategoryTemplate {
  categoryName: string
  icon: string
  fields: FieldDefinition[]
}

const categoryTemplates: { [key: string]: CategoryTemplate } = {
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
        options: ['$', '$$', '$$$', '$$$$']
      },
      {
        name: 'delivery',
        label: 'Доставка',
        type: 'boolean',
        required: false
      },
      {
        name: 'reservation',
        label: 'Резервации',
        type: 'boolean',
        required: false
      },
      {
        name: 'menu_url',
        label: 'Линк към меню',
        type: 'url',
        required: false,
        placeholder: 'https://example.com/menu.pdf'
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
        type: 'multi-select',
        required: true,
        options: ['Подстригване жени', 'Подстригване мъже', 'Боядисване', 'Къдрене', 'Изправяне', 'Маски', 'Масаж']
      },
      {
        name: 'price_list',
        label: 'Ценоразпис',
        type: 'textarea',
        required: false,
        placeholder: 'Подстригване жени: 25лв\nБоядисване: 45лв\nМаска: 15лв'
      },
      {
        name: 'appointment_booking',
        label: 'Записване на час',
        type: 'boolean',
        required: false
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
        type: 'multi-select',
        required: true,
        options: ['Единична', 'Двойна', 'Апартамент', 'Луксозна', 'Семейна']
      },
      {
        name: 'amenities',
        label: 'Удобства',
        type: 'multi-select',
        required: false,
        options: ['WiFi', 'Паркинг', 'Басейн', 'Фитнес', 'SPA', 'Ресторант', 'Климатик', 'Телевизор']
      },
      {
        name: 'price_range',
        label: 'Цени за нощувка',
        type: 'textarea',
        required: false,
        placeholder: 'Единична: 80лв\nДвойна: 120лв\nАпартамент: 200лв'
      }
    ]
  },

  'автосервизи': {
    categoryName: 'Автосервизи',
    icon: '🚗',
    fields: [
      {
        name: 'services',
        label: 'Услуги',
        type: 'multi-select',
        required: true,
        options: ['Смяна на масло', 'Гуми', 'Спирачки', 'Диагностика', 'Електрика', 'Климатик', 'Бояджийски работи']
      },
      {
        name: 'car_brands',
        label: 'Марки автомобили',
        type: 'multi-select',
        required: false,
        options: ['BMW', 'Mercedes', 'Audi', 'VW', 'Opel', 'Ford', 'Toyota', 'Всички марки']
      },
      {
        name: 'warranty',
        label: 'Гаранция',
        type: 'text',
        required: false,
        placeholder: '6 месеца на извършени услуги'
      }
    ]
  },

  'лекари': {
    categoryName: 'Лекари',
    icon: '👨‍⚕️',
    fields: [
      {
        name: 'specialty',
        label: 'Специалност',
        type: 'select',
        required: true,
        options: ['Общопрактикуващ', 'Кардиолог', 'Дерматолог', 'Гинеколог', 'Педиатър', 'Стоматолог', 'Очен лекар']
      },
      {
        name: 'accepted_insurance',
        label: 'Приемани застраховки',
        type: 'multi-select',
        required: false,
        options: ['НЗОК', 'ДЗИ', 'Булстрад', 'Уника', 'Euroins']
      },
      {
        name: 'consultation_fee',
        label: 'Цена на прегледа',
        type: 'text',
        required: false,
        placeholder: '50лв (без НЗОК), 15лв (с НЗОК)'
      },
      {
        name: 'appointment_required',
        label: 'Необходимо записване',
        type: 'boolean',
        required: false
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
        type: 'textarea',
        required: false,
        placeholder: 'Опишете вашите услуги...'
      }
    ]
  }
}

function getTemplateForCategory(categorySlug: string): CategoryTemplate {
  return categoryTemplates[categorySlug] || categoryTemplates['default']
}

interface WizardStep {
  title: string
  description: string
  component: React.ReactNode
}

export default function SmartBusinessWizard() {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [businessData, setBusinessData] = useState<any>({
    name: '',
    description: '',
    address: '',
    city: 'Бургас',
    phone: '',
    email: '',
    website: '',
    working_hours: '',
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

  const renderField = (field: FieldDefinition) => {
    const value = businessData.custom_fields[field.name] || ''
    
    const updateField = (newValue: any) => {
      setBusinessData((prev: any) => ({
        ...prev,
        custom_fields: {
          ...prev.custom_fields,
          [field.name]: newValue
        }
      }))
    }

    switch (field.type) {
      case 'select':
        return (
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={value}
            onChange={(e) => updateField(e.target.value)}
            required={field.required}
          >
            <option value="">Избери {field.label.toLowerCase()}</option>
            {field.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        )

      case 'multi-select':
        return (
          <div className="space-y-2">
            {field.options?.map(option => (
              <label key={option} className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={Array.isArray(value) && value.includes(option)}
                  onChange={(e) => {
                    const currentArray = Array.isArray(value) ? value : []
                    if (e.target.checked) {
                      updateField([...currentArray, option])
                    } else {
                      updateField(currentArray.filter((item: string) => item !== option))
                    }
                  }}
                />
                {option}
              </label>
            ))}
          </div>
        )

      case 'boolean':
        return (
          <label className="flex items-center">
            <input
              type="checkbox"
              className="mr-2"
              checked={value === true}
              onChange={(e) => updateField(e.target.checked)}
            />
            Да
          </label>
        )

      case 'textarea':
        return (
          <textarea
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            rows={3}
            value={value}
            onChange={(e) => updateField(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        )

      case 'number':
        return (
          <input
            type="number"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={value}
            onChange={(e) => updateField(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        )

      default: // text, url
        return (
          <input
            type={field.type === 'url' ? 'url' : 'text'}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={value}
            onChange={(e) => updateField(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        )
    }
  }

  const steps: WizardStep[] = [
    // Step 1: Category Selection
    {
      title: "Избери тип бизнес",
      description: "Какъв тип бизнес добавяте?",
      component: (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map(category => (
            <button
              key={category.slug}
              onClick={() => {
                setSelectedCategory(category.slug)
                setSelectedCategoryId(category.id)
                setBusinessData((prev: any) => ({ ...prev, category: category.name }))
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
      )
    },

    // Step 2: Basic Info
    {
      title: "Основна информация",
      description: "Въведете основните данни за бизнеса",
      component: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Име на бизнеса *</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={businessData.name}
              onChange={(e) => setBusinessData((prev: any) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Описание</label>
            <textarea
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={businessData.description}
              onChange={(e) => setBusinessData((prev: any) => ({ ...prev, description: e.target.value }))}
              placeholder="Кратко описание на бизнеса..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Работно време</label>
            <textarea
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={businessData.working_hours}
              onChange={(e) => setBusinessData((prev: any) => ({ ...prev, working_hours: e.target.value }))}
              placeholder="Пн-Пт: 09:00-17:00&#10;Сб: 09:00-13:00"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Адрес</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={businessData.address}
                onChange={(e) => setBusinessData((prev: any) => ({ ...prev, address: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Телефон</label>
              <input
                type="tel"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={businessData.phone}
                onChange={(e) => setBusinessData((prev: any) => ({ ...prev, phone: e.target.value }))}
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
          {getTemplateForCategory(selectedCategory).fields.map(field => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label} {field.required && '*'}
              </label>
              {renderField(field)}
              {field.description && (
                <p className="text-sm text-gray-500 mt-1">{field.description}</p>
              )}
            </div>
          ))}
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
            <p><strong>Категория:</strong> {businessData.category}</p>
            <p><strong>Адрес:</strong> {businessData.address}</p>
            <p><strong>Телефон:</strong> {businessData.phone}</p>
            <p><strong>Работно време:</strong> {businessData.working_hours}</p>
          </div>

          {Object.keys(businessData.custom_fields).length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Специфична информация:</h3>
              {Object.entries(businessData.custom_fields).map(([key, value]) => (
                <p key={key}>
                  <strong>{key}:</strong> {Array.isArray(value) ? value.join(', ') : String(value)}
                </p>
              ))}
            </div>
          )}
        </div>
      )
    }
  ]

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
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
          working_hours: businessData.working_hours || null,
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
          working_hours: '',
          custom_fields: {}
        })
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
              <h1 className="text-2xl font-bold text-gray-900 mb-2">🧙‍♂️ Smart Business Wizard</h1>
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
                disabled={currentStep === 0 && !selectedCategory}
                className={`px-6 py-2 rounded-lg ${
                  (currentStep === 0 && !selectedCategory)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
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