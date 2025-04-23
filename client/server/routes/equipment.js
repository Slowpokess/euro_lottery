const express = require('express');
const { 
  getEquipment, 
  getEquipmentById, 
  createEquipment, 
  updateEquipment, 
  deleteEquipment 
} = require('../controllers/equipment');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Публичные маршруты
router.get('/', getEquipment);
router.get('/:id', getEquipmentById);

// Защищенные маршруты (только для авторизованных пользователей)
router.post('/', protect, authorize(['admin', 'editor']), upload.array('images', 5), createEquipment);
router.put('/:id', protect, authorize(['admin', 'editor']), upload.array('images', 5), updateEquipment);
router.delete('/:id', protect, authorize(['admin', 'editor']), deleteEquipment);

module.exports = router;