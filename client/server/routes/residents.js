const express = require('express');
const {
  getResidents,
  getResident,
  createResident,
  updateResident,
  deleteResident,
  residentPhotoUpload
} = require('../controllers/residents');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(getResidents)
  .post(protect, authorize('admin'), createResident);

router.route('/:id')
  .get(getResident)
  .put(protect, authorize('admin'), updateResident)
  .delete(protect, authorize('admin'), deleteResident);

router.route('/:id/photo')
  .put(protect, authorize('admin'), residentPhotoUpload);

module.exports = router;