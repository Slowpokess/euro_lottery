/**
 * Константы для всего приложения
 * Централизация всех константных значений для облегчения поддержки и изменений
 */

// API конфигурация
export const API = {
  BASE_URL: process.env.REACT_APP_API_URL || '/api',
  TIMEOUT: 15000,
};

// Размеры страниц пагинации
export const PAGE_SIZES = {
  DEFAULT: 10,
  SMALL: 5,
  LARGE: 20,
  ADMIN_TABLE: 15
};

// Статусы событий
export const EVENT_STATUSES = {
  UPCOMING: 'upcoming',
  PAST: 'past',
  CANCELLED: 'cancelled'
};

// Статусы новостей
export const NEWS_STATUSES = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
};

// Статусы промоушн-запросов
export const PROMOTION_REQUEST_STATUSES = {
  NEW: 'new',
  CONTACTED: 'contacted',
  COMPLETED: 'completed'
};

// Статусы запросов аренды
export const RENT_REQUEST_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  COMPLETED: 'completed'
};

// Категории промоушн-услуг
export const PROMOTION_CATEGORIES = {
  PROMOTION: 'promotion',
  ARTISTS: 'artists',
  VENUES: 'venues'
};

// Бюджетные категории для запросов
export const BUDGET_CATEGORIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  UNDEFINED: 'undefined'
};

// Пути к заполнителям изображений
export const DEFAULT_IMAGES = {
  EVENT: '/images/event-placeholder.jpg',
  NEWS: '/images/news-placeholder.jpg',
  EQUIPMENT: '/images/equipment-placeholder.jpg',
  RESIDENT: '/images/residents-placeholder.jpg',
  SPACE: '/images/space-placeholder.jpg'
};

// Роли пользователей
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user'
};

// Пути для загрузки файлов
export const UPLOAD_PATHS = {
  EVENTS: '/uploads/events',
  NEWS: '/uploads/news',
  EQUIPMENT: '/uploads/equipment',
  PROMOTIONS: '/uploads/promotions',
  RESIDENTS: '/uploads/residents',
  SPACES: '/uploads/spaces'
};

// Константы локализации
export const LANGUAGES = {
  UA: 'ua',
  RU: 'ru',
  EN: 'en'
};

// Константы для анимаций
export const ANIMATION = {
  DURATION: 300,
  EASE: 'ease-in-out'
};

// Константы для работы с localStorage
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'collider_auth_token',
  AUTH_TOKEN_EXPIRY: 'collider_token_expiry',
  USER: 'collider_user',
  LANGUAGE: 'collider_language'
};

// Максимальные размеры файлов в байтах
export const MAX_FILE_SIZES = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  VIDEO: 50 * 1024 * 1024, // 50MB
  DOCUMENT: 10 * 1024 * 1024 // 10MB
};

// Допустимые форматы файлов
export const ACCEPTED_FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  VIDEOS: ['video/mp4', 'video/webm', 'video/ogg'],
  DOCUMENTS: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
};

// Валидационные константы
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_NAME_LENGTH: 100,
  MAX_EMAIL_LENGTH: 100,
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_MESSAGE_LENGTH: 2000,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^\+?\d{7,15}$/
};