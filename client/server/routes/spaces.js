const express = require('express');
const {
  getSpaces,
  getSpace,
  getSpaceByCustomId,
  createSpace,
  updateSpace,
  deleteSpace,
  spaceImageUpload
} = require('../controllers/spaces');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(getSpaces)
  .post(protect, authorize('admin'), createSpace);

router.route('/:id')
  .get(getSpace)
  .put(protect, authorize('admin'), updateSpace)
  .delete(protect, authorize('admin'), deleteSpace);

router.route('/custom/:customId')
  .get(getSpaceByCustomId);

router.route('/:id/image')
  .put(protect, authorize('admin'), spaceImageUpload);

module.exports = router;