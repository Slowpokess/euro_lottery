const express = require('express');
const { 
  getEvents, 
  getEvent, 
  createEvent, 
  updateEvent, 
  deleteEvent 
} = require('../controllers/events');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Публичные маршруты
router.get('/', getEvents);
router.get('/:id', getEvent);

// Защищенные маршруты (для админов и редакторов)
router.post('/', protect, authorize(['admin', 'editor']), upload.single('image'), createEvent);
router.put('/:id', protect, authorize(['admin', 'editor']), upload.single('image'), updateEvent);
router.delete('/:id', protect, authorize(['admin', 'editor']), deleteEvent);

module.exports = router;