const express = require('express');
const router = express.Router();
const { dashboard } = require('../controllers/dashboard.controller');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');


router.get('/', authenticate, authorize(['admin']), asyncHandler(dashboard));

module.exports = router;