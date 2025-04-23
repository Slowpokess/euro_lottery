const mongoose = require('mongoose');

const NewsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Пожалуйста, укажите заголовок новости'],
    trim: true,
    maxlength: [200, 'Заголовок не может быть длиннее 200 символов']
  },
  content: {
    type: String,
    required: [true, 'Пожалуйста, добавьте содержание новости']
  },
  excerpt: {
    type: String,
    maxlength: [500, 'Краткое описание не может быть длиннее 500 символов']
  },
  image: {
    type: String,
    default: '/images/news-placeholder.jpg'
  },
  slug: {
    type: String,
    unique: true
  },
  publishDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },
  featured: {
    type: Boolean,
    default: false
  },
  categories: {
    type: [String],
    default: ['news']
  },
  tags: {
    type: [String],
    default: []
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  views: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Генерация slug из заголовка перед сохранением
NewsSchema.pre('save', function(next) {
  // Обновление даты изменения
  this.updatedAt = Date.now();
  
  // Создание slug из заголовка, если его нет
  if (!this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\sа-яё]/g, '') // Удаляем спецсимволы, оставляем буквы, цифры и пробелы
      .replace(/\s+/g, '-') // Заменяем пробелы на дефисы
      .replace(/[а-яё]/g, function(match) { // Транслитерация кириллицы
        const charMap = {
          'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
          'з': 'z', 'и': 'i', 'й': 'j', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
          'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'c',
          'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu',
          'я': 'ya'
        };
        return charMap[match] || match;
      })
      .trim();
    
    // Добавляем случайную строку для уникальности
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 5);
    this.slug = `${this.slug}-${timestamp}${randomStr}`;
  }
  
  // Автоматическое создание excerpt, если его нет
  if (!this.excerpt && this.content) {
    // Берем первые 300 символов контента, удаляем HTML-теги
    const plainText = this.content.replace(/<[^>]*>/g, '');
    this.excerpt = plainText.substring(0, 300) + (plainText.length > 300 ? '...' : '');
  }
  
  next();
});

module.exports = mongoose.model('News', NewsSchema);