const mongoose = require('mongoose');

const PromotionContactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Пожалуйста, укажите имя'],
    trim: true,
    maxlength: [100, 'Имя не может быть длиннее 100 символов']
  },
  email: {
    type: String,
    required: [true, 'Пожалуйста, укажите email'],
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Пожалуйста, укажите корректный email'
    ],
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  eventType: {
    type: String,
    required: [true, 'Пожалуйста, укажите тип мероприятия'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Пожалуйста, опишите ваше мероприятие'],
    trim: true
  },
  budget: {
    type: String,
    enum: ['low', 'medium', 'high', 'undefined'],
    default: 'undefined'
  },
  eventDate: {
    type: Date
  },
  attendees: {
    type: String,
    trim: true
  },
  servicesNeeded: [{
    type: String,
    enum: ['organization', 'promotion', 'technical', 'production', 'consulting', 'other'],
    default: 'organization'
  }],
  status: {
    type: String,
    enum: ['new', 'contacted', 'in-progress', 'completed', 'cancelled'],
    default: 'new'
  },
  notes: {
    type: String,
    trim: true
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
PromotionContactSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('PromotionContact', PromotionContactSchema);