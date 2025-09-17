const express = require('express');
const router = express.Router();
const { register, login, verifyEmail, forgotPassword, resetPassword, resendVerification, refresh, logout } = require('../controllers/auth.controller');
const { limitLoginAttempts } = require('../middleware/loginLimiter');
const { forgotPasswordLimiter, resendVerificationLimiter } = require('../middleware/rateLimiter');
const asyncHandler = require('../utils/asyncHandler');

const isProd = process.env.NODE_ENV === 'production';


router.post('/register', asyncHandler(register));

// Apply rate limiting middleware to login route
router.post('/login', isProd ? limitLoginAttempts:(req, res, next) => next(), asyncHandler(login));

router.post('/refresh', asyncHandler(refresh));
router.post('/logout', asyncHandler(logout));

router.get('/verify-email', asyncHandler(verifyEmail));
router.post('/forgot-password', forgotPasswordLimiter, asyncHandler(forgotPassword));
router.post('/reset-password', asyncHandler(resetPassword));
router.post('/resend-verification', resendVerificationLimiter, asyncHandler(resendVerification));

module.exports = router;