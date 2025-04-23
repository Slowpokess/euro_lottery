const express = require('express');
const { 
  getRentRequests, 
  getRentRequest, 
  createRentRequest, 
  updateRentRequestStatus, 
  deleteRentRequest,
  getRentRequestsStats
} = require('../controllers/rentRequests');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/rent-requests
 * @desc    Получение всех заявок на аренду
 * @access  Private (admin, editor)
 * @params  status, startDate, endDate, search, sort, limit, skip
 * @returns {Array} заявки на аренду
 */
router.get('/', protect, authorize(['admin', 'editor']), getRentRequests);

/**
 * @route   GET /api/rent-requests/stats
 * @desc    Получение статистики по заявкам
 * @access  Private (admin, editor)
 * @returns {Object} статистика
 */
router.get('/stats', protect, authorize(['admin', 'editor']), getRentRequestsStats);

/**
 * @route   GET /api/rent-requests/:id
 * @desc    Получение одной заявки на аренду
 * @access  Private (admin, editor)
 * @returns {Object} заявка
 */
router.get('/:id', protect, authorize(['admin', 'editor']), getRentRequest);

/**
 * @route   POST /api/rent-requests
 * @desc    Создание новой заявки на аренду
 * @access  Public
 * @body    name, email, phone, startDate, endDate, equipmentItems, etc.
 * @returns {Object} созданная заявка
 */
router.post('/', createRentRequest);

/**
 * @route   PUT /api/rent-requests/:id/status
 * @desc    Обновление статуса заявки
 * @access  Private (admin, editor)
 * @body    status, adminComment
 * @returns {Object} обновленная заявка
 */
router.put('/:id/status', protect, authorize(['admin', 'editor']), updateRentRequestStatus);

/**
 * @route   DELETE /api/rent-requests/:id
 * @desc    Удаление заявки
 * @access  Private (только admin)
 * @returns {Object} пустой объект
 */
router.delete('/:id', protect, authorize(['admin']), deleteRentRequest);

module.exports = router;