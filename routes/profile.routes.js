const express = require('express');
const router = express.Router();
const { getProfile, updateProfile } = require('../controllers/profile.controller');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate } = require('../middleware/auth.middleware');


router.get('/', authenticate, asyncHandler(getProfile));
router.post('/', authenticate, asyncHandler(updateProfile));

module.exports = router;