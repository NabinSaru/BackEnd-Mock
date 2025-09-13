const express = require('express');
const router = express.Router();
const { register, login, refresh, logout } = require('../controllers/auth.controller');
const { limitLoginAttempts } = require('../middleware/loginLimiter');
const asyncHandler = require('../utils/asyncHandler');

const isProd = process.env.NODE_ENV === 'production';


router.post('/register', asyncHandler(register));

// Apply rate limiting middleware to login route
router.post('/login', isProd ? limitLoginAttempts:(req, res, next) => next(), asyncHandler(login));

router.post('/refresh', asyncHandler(refresh));
router.post('/logout', asyncHandler(logout));

module.exports = router;