const express = require('express');
const {
  getPromotions,
  getPromotion,
  createPromotion,
  updatePromotion,
  deletePromotion,
  promotionPhotoUpload
} = require('../controllers/promotions');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(getPromotions)
  .post(protect, authorize('admin'), createPromotion);

router.route('/:id')
  .get(getPromotion)
  .put(protect, authorize('admin'), updatePromotion)
  .delete(protect, authorize('admin'), deletePromotion);

router.route('/:id/photo')
  .put(protect, authorize('admin'), promotionPhotoUpload);

module.exports = router;