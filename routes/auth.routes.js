const express = require('express');
const router = express.Router();
const { register, login, refresh, logout } = require('../controllers/auth.controller');
// const { limitLoginAttempts } = require('../middleware/loginLimiter');

const isProd = process.env.NODE_ENV === 'production';

router.post('/register', register);

// Apply rate limiting middleware to login route
router.post('/login', isProd ? limitLoginAttempts:(req, res, next) => next(), login);
// router.post('/login', login);

router.post('/refresh', refresh);
router.post('/logout', logout);

module.exports = router;