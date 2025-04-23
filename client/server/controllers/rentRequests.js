const RentRequest = require('../models/RentRequest');
const Equipment = require('../models/Equipment');

// @desc    Получение всех заявок
// @route   GET /api/rent-requests
// @access  Public/Private
exports.getRentRequests = async (req, res, next) => {
  try {
    // Фильтры и пагинация
    const { 
      status, 
      startDate, 
      endDate, 
      search,
      sort = '-createdAt', 
      limit = 10, 
      skip = 0
    } = req.query;
    
    // Формируем запрос
    let query = {};
    
    // Фильтр по статусу
    if (status) {
      query.status = status;
    }
    
    // Фильтр по диапазону дат
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.endDate.$lte = new Date(endDate);
    }
    
    // Поиск по имени/email/телефону
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { eventName: { $regex: search, $options: 'i' } }
      ];
    }
    
    console.log('Запрос заявок на аренду:', query);
    
    // Получаем заявки
    const requests = await RentRequest.find(query)
      .populate({
        path: 'equipmentItems.equipment',
        select: 'name category price priceUnit'
      })
      .populate({
        path: 'processedBy',
        select: 'username'
      })
      .sort(sort)
      .skip(parseInt(skip))
      .limit(parseInt(limit));
    
    // Получаем общее количество заявок
    const total = await RentRequest.countDocuments(query);
    
    console.log(`Найдено ${requests.length} заявок из ${total}`);
    
    res.status(200).json({
      success: true,
      count: requests.length,
      total,
      data: requests
    });
  } catch (error) {
    console.error('Ошибка при получении заявок:', error);
    next(error);
  }
};

// @desc    Получение одной заявки
// @route   GET /api/rent-requests/:id
// @access  Public/Private
exports.getRentRequest = async (req, res, next) => {
  try {
    const request = await RentRequest.findById(req.params.id)
      .populate({
        path: 'equipmentItems.equipment',
        select: 'name category description price priceUnit images'
      })
      .populate({
        path: 'processedBy',
        select: 'username'
      });
    
    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Заявка не найдена'
      });
    }
    
    res.status(200).json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error('Ошибка при получении заявки:', error);
    next(error);
  }
};

// @desc    Создание заявки
// @route   POST /api/rent-requests
// @access  Public
exports.createRentRequest = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      organization,
      eventName,
      eventType,
      eventLocation,
      startDate,
      endDate,
      equipmentItems,
      additionalServices,
      comment
    } = req.body;
    
    console.log('Создание новой заявки на аренду:', { name, email, startDate, endDate });
    
    // Проверка доступности оборудования на указанные даты
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      return res.status(400).json({
        success: false,
        error: 'Дата начала аренды не может быть позже даты окончания'
      });
    }
    
    // Проверяем, что в заявке есть оборудование
    if (!equipmentItems || !Array.isArray(equipmentItems) || equipmentItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Необходимо выбрать хотя бы один предмет оборудования'
      });
    }
    
    // Проверяем доступность каждого оборудования
    for (const item of equipmentItems) {
      const equipment = await Equipment.findById(item.equipment);
      
      if (!equipment) {
        return res.status(404).json({
          success: false,
          error: `Оборудование с ID ${item.equipment} не найдено`
        });
      }
      
      if (equipment.status !== 'available') {
        return res.status(400).json({
          success: false,
          error: `Оборудование "${equipment.name}" в данный момент недоступно для аренды`
        });
      }
      
      // Здесь можно добавить проверку на пересечение с другими заявками
      // Это потребует дополнительной логики для проверки доступности на конкретные даты
    }
    
    // Создаем заявку
    const rentRequest = new RentRequest({
      name,
      email,
      phone,
      organization,
      eventName,
      eventType,
      eventLocation,
      startDate,
      endDate,
      equipmentItems,
      additionalServices: additionalServices || {},
      comment
    });
    
    // Рассчитываем стоимость
    await rentRequest.calculateTotalPrice();
    
    // Сохраняем заявку
    await rentRequest.save();
    
    console.log('Заявка успешно создана:', rentRequest._id);
    
    res.status(201).json({
      success: true,
      data: rentRequest
    });
  } catch (error) {
    console.error('Ошибка при создании заявки:', error);
    next(error);
  }
};

// @desc    Обновление статуса заявки
// @route   PUT /api/rent-requests/:id/status
// @access  Private
exports.updateRentRequestStatus = async (req, res, next) => {
  try {
    const { status, adminComment } = req.body;
    
    // Проверяем, что статус валидный
    const validStatuses = ['pending', 'confirmed', 'rejected', 'canceled', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Некорректный статус заявки'
      });
    }
    
    const request = await RentRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Заявка не найдена'
      });
    }
    
    // Проверяем, можно ли обновить статус
    if (!request.isEditable && request.status !== status) {
      return res.status(400).json({
        success: false,
        error: `Невозможно изменить статус заявки из "${request.status}" в "${status}"`
      });
    }
    
    // Обновляем статус и добавляем комментарий администратора
    request.status = status;
    if (adminComment) request.adminComment = adminComment;
    
    // Устанавливаем информацию о том, кто обработал заявку
    request.processedBy = req.user.id;
    request.processedAt = Date.now();
    
    await request.save();
    
    console.log(`Статус заявки ${request._id} обновлен на "${status}"`);
    
    res.status(200).json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error('Ошибка при обновлении статуса заявки:', error);
    next(error);
  }
};

// @desc    Удаление заявки
// @route   DELETE /api/rent-requests/:id
// @access  Private
exports.deleteRentRequest = async (req, res, next) => {
  try {
    const request = await RentRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Заявка не найдена'
      });
    }
    
    // Проверяем, можно ли удалить заявку (например, только в статусе 'completed' или 'rejected')
    const deletableStatuses = ['completed', 'rejected', 'canceled'];
    if (!deletableStatuses.includes(request.status)) {
      return res.status(400).json({
        success: false,
        error: `Невозможно удалить заявку в статусе "${request.status}"`
      });
    }
    
    await request.remove();
    
    console.log(`Заявка ${req.params.id} успешно удалена`);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Ошибка при удалении заявки:', error);
    next(error);
  }
};

// @desc    Получение статистики по заявкам
// @route   GET /api/rent-requests/stats
// @access  Private
exports.getRentRequestsStats = async (req, res, next) => {
  try {
    // Используем Promise.all для параллельного выполнения запросов
    const [
      total,
      pending,
      confirmed,
      completed,
      rejected,
      canceled,
      // Количество заявок по месяцам (за последние 6 месяцев)
      monthlyStats,
      // Топ-5 наиболее востребованного оборудования
      popularEquipment
    ] = await Promise.all([
      RentRequest.countDocuments({}),
      RentRequest.countDocuments({ status: 'pending' }),
      RentRequest.countDocuments({ status: 'confirmed' }),
      RentRequest.countDocuments({ status: 'completed' }),
      RentRequest.countDocuments({ status: 'rejected' }),
      RentRequest.countDocuments({ status: 'canceled' }),
      
      // Агрегация по месяцам
      RentRequest.aggregate([
        {
          $match: {
            createdAt: { 
              $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) 
            }
          }
        },
        {
          $group: {
            _id: { 
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 }
        }
      ]),
      
      // Агрегация по популярному оборудованию
      RentRequest.aggregate([
        {
          $unwind: '$equipmentItems'
        },
        {
          $group: {
            _id: '$equipmentItems.equipment',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: 5
        },
        {
          $lookup: {
            from: 'equipment', // Название коллекции в MongoDB
            localField: '_id',
            foreignField: '_id',
            as: 'equipmentDetails'
          }
        },
        {
          $unwind: '$equipmentDetails'
        },
        {
          $project: {
            _id: 1,
            count: 1,
            name: '$equipmentDetails.name',
            category: '$equipmentDetails.category'
          }
        }
      ])
    ]);
    
    // Обработка данных по месяцам для удобного отображения
    const monthNames = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    
    const formattedMonthlyStats = monthlyStats.map(item => ({
      month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      count: item.count
    }));
    
    const stats = {
      total,
      byStatus: {
        pending,
        confirmed,
        completed,
        rejected,
        canceled
      },
      monthlyCounts: formattedMonthlyStats,
      popularEquipment
    };
    
    console.log('Статистика заявок успешно получена');
    
    res.status(200).json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Ошибка при получении статистики заявок:', error);
    next(error);
  }
};