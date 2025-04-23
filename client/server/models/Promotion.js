const mongoose = require('mongoose');

const PromotionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Пожалуйста, укажите название услуги'],
    trim: true,
    maxlength: [100, 'Название не может быть длиннее 100 символов']
  },
  description: {
    type: String,
    required: [true, 'Пожалуйста, добавьте описание услуги'],
    trim: true
  },
  image: {
    type: String,
    default: '/images/event-placeholder.jpg'
  },
  category: {
    type: String,
    required: [true, 'Пожалуйста, укажите категорию услуги'],
    enum: ['organization', 'promotion', 'technical', 'production', 'consulting', 'other'],
    default: 'organization'
  },
  features: [{
    type: String,
    trim: true
  }],
  pricing: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  featured: {
    type: Boolean,
    default: false
  },
  order: {
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

// Обновление даты изменения перед сохранением
PromotionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Promotion', PromotionSchema);