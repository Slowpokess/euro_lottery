const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Пожалуйста, укажите название события'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Пожалуйста, укажите дату события']
  },
  description: {
    type: String,
    required: [true, 'Пожалуйста, добавьте описание события']
  },
  image: {
    type: String,
    default: '/images/event-placeholder.jpg'
  },
  status: {
    type: String,
    enum: ['upcoming', 'past', 'cancelled'],
    default: 'upcoming'
  },
  lineup: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  ticketLink: {
    type: String,
    default: ''
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
EventSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Event', EventSchema);