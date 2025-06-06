// src/lib/categoryTemplates.ts

export interface FieldDefinition {
    name: string
    label: string
    type: 'text' | 'textarea' | 'number' | 'select' | 'multi-select' | 'file' | 'json' | 'boolean' | 'time' | 'url'
    required: boolean
    placeholder?: string
    options?: string[]
    description?: string
  }
  
  export interface CategoryTemplate {
    categoryName: string
    icon: string
    fields: FieldDefinition[]
  }
  
  export const categoryTemplates: { [key: string]: CategoryTemplate } = {
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
          name: 'working_hours',
          label: 'Работно време',
          type: 'textarea',
          required: true,
          placeholder: 'Пн-Пт: 10:00-22:00\nСб-Нд: 11:00-23:00'
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
        },
        {
          name: 'capacity',
          label: 'Брой места',
          type: 'number',
          required: false,
          placeholder: '50'
        },
        {
          name: 'outdoor_seating',
          label: 'Външна тераса',
          type: 'boolean',
          required: false
        },
        {
          name: 'parking',
          label: 'Паркинг',
          type: 'boolean',
          required: false
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
          name: 'working_hours',
          label: 'Работно време',
          type: 'textarea',
          required: true,
          placeholder: 'Пн-Пт: 09:00-18:00\nСб: 09:00-16:00'
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
        },
        {
          name: 'brands_used',
          label: 'Използвани марки',
          type: 'textarea',
          required: false,
          placeholder: 'L\'Oreal, Schwarzkopf, Wella...'
        },
        {
          name: 'online_booking_url',
          label: 'Онлайн записване',
          type: 'url',
          required: false,
          placeholder: 'https://booking.example.com'
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
        },
        {
          name: 'check_in_out',
          label: 'Настаняване/Напускане',
          type: 'text',
          required: false,
          placeholder: 'Настаняване: 14:00, Напускане: 12:00'
        },
        {
          name: 'total_rooms',
          label: 'Общо стаи',
          type: 'number',
          required: false,
          placeholder: '50'
        },
        {
          name: 'booking_url',
          label: 'Онлайн резервации',
          type: 'url',
          required: false,
          placeholder: 'https://booking.com/hotel-xyz'
        },
        {
          name: 'cancellation_policy',
          label: 'Условия за отказ',
          type: 'textarea',
          required: false,
          placeholder: 'Безплатен отказ до 24ч преди настаняване'
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
          name: 'working_hours',
          label: 'Работно време',
          type: 'textarea',
          required: true,
          placeholder: 'Пн-Пт: 08:00-17:00\nСб: 08:00-13:00'
        },
        {
          name: 'warranty',
          label: 'Гаранция',
          type: 'text',
          required: false,
          placeholder: '6 месеца на извършени услуги'
        },
        {
          name: 'emergency_service',
          label: 'Аварийна помощ',
          type: 'boolean',
          required: false
        },
        {
          name: 'towing_service',
          label: 'Пътна помощ',
          type: 'boolean',
          required: false
        },
        {
          name: 'inspection_service',
          label: 'Технически прегледи',
          type: 'boolean',
          required: false
        },
        {
          name: 'payment_methods',
          label: 'Начини на плащане',
          type: 'multi-select',
          required: false,
          options: ['В брой', 'Банкова карта', 'Банков превод', 'По фактура']
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
          name: 'consultation_hours',
          label: 'Часове за прием',
          type: 'textarea',
          required: true,
          placeholder: 'Пн, Ср, Пт: 14:00-18:00\nВт, Чт: 08:00-12:00'
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
        },
        {
          name: 'languages',
          label: 'Езици',
          type: 'multi-select',
          required: false,
          options: ['Български', 'Английски', 'Немски', 'Руски', 'Турски']
        },
        {
          name: 'education',
          label: 'Образование/Специализации',
          type: 'textarea',
          required: false,
          placeholder: 'МУ-София, специализация в...'
        }
      ]
    },
  
    'магазини': {
      categoryName: 'Магазини',
      icon: '🏪',
      fields: [
        {
          name: 'product_categories',
          label: 'Категории продукти',
          type: 'multi-select',
          required: true,
          options: ['Храни', 'Дрехи', 'Обувки', 'Електроника', 'Книги', 'Спорт', 'Козметика', 'Подаръци']
        },
        {
          name: 'working_hours',
          label: 'Работно време',
          type: 'textarea',
          required: true,
          placeholder: 'Пн-Пт: 09:00-19:00\nСб: 09:00-17:00\nНд: 10:00-16:00'
        },
        {
          name: 'payment_methods',
          label: 'Начини на плащане',
          type: 'multi-select',
          required: false,
          options: ['В брой', 'Банкова карта', 'Банков превод', 'PayPal', 'Apple Pay']
        },
        {
          name: 'delivery',
          label: 'Доставка',
          type: 'boolean',
          required: false
        },
        {
          name: 'online_store',
          label: 'Онлайн магазин',
          type: 'url',
          required: false,
          placeholder: 'https://store.example.com'
        },
        {
          name: 'brands',
          label: 'Марки/Брандове',
          type: 'textarea',
          required: false,
          placeholder: 'Nike, Adidas, Puma...'
        }
      ]
    },
  
    'училища': {
      categoryName: 'Училища',
      icon: '🏫',
      fields: [
        {
          name: 'education_level',
          label: 'Образователна степен',
          type: 'select',
          required: true,
          options: ['Детска градина', 'Начално училище', 'Основно училище', 'Средно училище', 'Гимназия', 'Професионално училище']
        },
        {
          name: 'specializations',
          label: 'Специализации',
          type: 'multi-select',
          required: false,
          options: ['Математика', 'Науки', 'Езици', 'Изкуства', 'Спорт', 'Информатика', 'Музика']
        },
        {
          name: 'student_capacity',
          label: 'Брой ученици',
          type: 'number',
          required: false,
          placeholder: '500'
        },
        {
          name: 'facilities',
          label: 'Съоръжения',
          type: 'multi-select',
          required: false,
          options: ['Спортна зала', 'Библиотека', 'Лаборатории', 'Столова', 'Компютърен кабинет', 'Детска площадка']
        },
        {
          name: 'transport',
          label: 'Транспорт',
          type: 'boolean',
          required: false
        },
        {
          name: 'extracurricular',
          label: 'Извънкласни дейности',
          type: 'textarea',
          required: false,
          placeholder: 'Спорт, музика, танци, роботика...'
        }
      ]
    },
  
    // Default template за неопределени категории
    'default': {
      categoryName: 'Общ бизнес',
      icon: '🏢',
      fields: [
        {
          name: 'working_hours',
          label: 'Работно време',
          type: 'textarea',
          required: false,
          placeholder: 'Пн-Пт: 09:00-17:00'
        },
        {
          name: 'services',
          label: 'Услуги',
          type: 'textarea',
          required: false,
          placeholder: 'Опишете вашите услуги...'
        },
        {
          name: 'payment_methods',
          label: 'Начини на плащане',
          type: 'multi-select',
          required: false,
          options: ['В брой', 'Банкова карта', 'Банков превод']
        }
      ]
    }
  }
  
  export function getTemplateForCategory(categoryName: string): CategoryTemplate {
    const normalizedName = categoryName.toLowerCase().replace(/\s+/g, '_')
    return categoryTemplates[normalizedName] || categoryTemplates['default']
  }
  
  export function getAllCategories(): string[] {
    return Object.keys(categoryTemplates).filter(key => key !== 'default')
  }
  
  export function getCategoryDisplayName(slug: string): string {
    const template = categoryTemplates[slug]
    return template ? template.categoryName : slug
  }
  
  export function getCategoryIcon(slug: string): string {
    const template = categoryTemplates[slug]
    return template ? template.icon : '🏢'
  }