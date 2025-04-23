const mongoose = require('mongoose');

const ResidentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Пожалуйста, укажите название резидента'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Пожалуйста, укажите категорию резидента'],
    enum: ['sound', 'light', 'visual', 'music', 'design', 'tech'],
    default: 'sound'
  },
  type: {
    type: String,
    required: [true, 'Пожалуйста, укажите тип резидента'],
    trim: true
  },
  image: {
    type: String,
    default: '/images/residents-placeholder.jpg'
  },
  description: {
    type: String,
    required: [true, 'Пожалуйста, добавьте описание резидента'],
    trim: true
  },
  contacts: {
    website: {
      type: String,
      default: ''
    },
    instagram: {
      type: String,
      default: ''
    },
    email: {
      type: String,
      default: ''
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active'
  },
  featured: {
    type: Boolean,
    default: false
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
ResidentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Resident', ResidentSchema);