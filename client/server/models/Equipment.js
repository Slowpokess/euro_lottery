const mongoose = require('mongoose');

const EquipmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Пожалуйста, укажите название оборудования'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Пожалуйста, укажите категорию оборудования'],
    enum: ['sound', 'light', 'stage', 'other']
  },
  description: {
    type: String,
    required: [true, 'Пожалуйста, добавьте описание оборудования']
  },
  price: {
    type: Number,
    required: [true, 'Пожалуйста, укажите цену аренды']
  },
  priceUnit: {
    type: String,
    default: 'day',
    enum: ['hour', 'day', 'event']
  },
  images: {
    type: [String],
    default: ['/images/equipment-placeholder.jpg']
  },
  status: {
    type: String,
    enum: ['available', 'unavailable', 'maintenance'],
    default: 'available'
  },
  specifications: {
    type: Object,
    default: {}
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
EquipmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Equipment', EquipmentSchema);