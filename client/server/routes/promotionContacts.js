const express = require('express');
const {
  getPromotionContacts,
  getPromotionContact,
  createPromotionContact,
  updatePromotionContact,
  deletePromotionContact
} = require('../controllers/promotionContacts');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(protect, authorize('admin'), getPromotionContacts)
  .post(createPromotionContact);

router.route('/:id')
  .get(protect, authorize('admin'), getPromotionContact)
  .put(protect, authorize('admin'), updatePromotionContact)
  .delete(protect, authorize('admin'), deletePromotionContact);

module.exports = router;