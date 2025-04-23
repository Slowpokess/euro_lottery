const mongoose = require('mongoose');

const RentRequestSchema = new mongoose.Schema({
  // Информация о клиенте
  name: {
    type: String,
    required: [true, 'Пожалуйста, укажите ваше имя'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Пожалуйста, укажите ваш email'],
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Пожалуйста, укажите корректный email'],
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Пожалуйста, укажите номер телефона'],
    trim: true
  },
  organization: {
    type: String,
    trim: true
  },
  
  // Информация о мероприятии
  eventName: {
    type: String,
    trim: true
  },
  eventType: {
    type: String,
    trim: true
  },
  eventLocation: {
    type: String,
    trim: true
  },
  
  // Информация о сроках аренды
  startDate: {
    type: Date,
    required: [true, 'Пожалуйста, укажите дату начала аренды']
  },
  endDate: {
    type: Date,
    required: [true, 'Пожалуйста, укажите дату окончания аренды']
  },
  
  // Список оборудования в заявке
  equipmentItems: [
    {
      equipment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Equipment',
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        default: 1,
        min: [1, 'Количество должно быть не менее 1']
      },
      days: {
        type: Number,
        required: true,
        default: 1,
        min: [1, 'Минимальный срок аренды - 1 день']
      }
    }
  ],
  
  // Дополнительная информация
  additionalServices: {
    delivery: {
      type: Boolean,
      default: false
    },
    setup: {
      type: Boolean,
      default: false
    },
    operator: {
      type: Boolean,
      default: false
    }
  },
  comment: {
    type: String,
    trim: true
  },
  
  // Статус заявки
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'rejected', 'canceled', 'completed'],
    default: 'pending'
  },
  
  // Административные поля
  adminComment: {
    type: String,
    trim: true
  },
  totalPrice: {
    type: Number,
    default: 0
  },
  
  // Метаданные
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedAt: {
    type: Date
  }
});

// Обновление даты изменения перед сохранением
RentRequestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Метод для расчета общей стоимости аренды
RentRequestSchema.methods.calculateTotalPrice = async function() {
  let total = 0;
  
  // Получаем полную информацию о каждом оборудовании
  for (const item of this.equipmentItems) {
    try {
      const equipment = await mongoose.model('Equipment').findById(item.equipment);
      if (equipment) {
        let itemPrice = equipment.price * item.quantity * item.days;
        total += itemPrice;
      }
    } catch (error) {
      console.error('Ошибка при расчете стоимости:', error);
    }
  }
  
  // Добавляем стоимость дополнительных услуг (можно настроить фиксированные цены)
  if (this.additionalServices.delivery) total += 1000; // Пример: доставка стоит 1000
  if (this.additionalServices.setup) total += 2000;    // Пример: настройка стоит 2000
  if (this.additionalServices.operator) total += 5000; // Пример: оператор стоит 5000 в день
  
  this.totalPrice = total;
  return total;
};

// Виртуальное свойство для продолжительности аренды в днях
RentRequestSchema.virtual('duration').get(function() {
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  return diffDays || 1; // Минимум 1 день
});

// Виртуальное свойство для проверки, можно ли изменять статус
RentRequestSchema.virtual('isEditable').get(function() {
  return ['pending', 'confirmed'].includes(this.status);
});

module.exports = mongoose.model('RentRequest', RentRequestSchema);