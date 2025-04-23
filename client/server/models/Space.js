const mongoose = require('mongoose');

const SpaceSchema = new mongoose.Schema({
  id: {
    type: String,
    required: [true, 'Пожалуйста, укажите ID пространства'],
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Пожалуйста, укажите название пространства'],
    trim: true
  },
  capacity: {
    type: String,
    required: [true, 'Пожалуйста, укажите вместимость'],
    trim: true
  },
  size: {
    type: String,
    required: [true, 'Пожалуйста, укажите площадь'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Пожалуйста, добавьте описание пространства'],
    trim: true
  },
  features: [{
    type: String,
    trim: true
  }],
  images: [{
    type: String,
    trim: true
  }],
  pricing: {
    amount: {
      type: Number,
      required: [true, 'Пожалуйста, укажите стоимость аренды']
    },
    period: {
      type: String,
      enum: ['hour', 'day', 'event'],
      default: 'day'
    },
    details: [{
      type: String,
      trim: true
    }]
  },
  status: {
    type: String,
    enum: ['available', 'unavailable', 'maintenance'],
    default: 'available'
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
SpaceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Space', SpaceSchema);