const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../utils/jwt');
const { registerSchema, loginSchema } = require('../validators/auth.validator');
const redisClient = require('../config/redis');

const REFRESH_PREFIX = 'refresh:';

const register = async (req, res) => {
  const { error, value } = registerSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map((d) => d.message);
    const errObj = new Error('Validation failed');
    errObj.status = 400;
    errObj.details = messages;
    throw errObj;
  }

  const { email, password } = value;
  const existing = await User.findOne({ email });
  if (existing) {
    const errObj = new Error('Email already registered');
    errObj.status = 409;
    throw errObj;
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = new User({ email, password: hashed });
  const savedUser = await user.save();

  const accessToken = generateAccessToken(savedUser);
  const refreshToken = generateRefreshToken(savedUser);

  await redisClient.set(`${REFRESH_PREFIX}${refreshToken}`, savedUser._id.toString(), {
    EX: 7 * 24 * 60 * 60,
  });

  res.status(201).json({
    message: 'User registered successfully',
    accessToken,
    refreshToken,
    user: {
      id: savedUser._id,
      email: savedUser.email,
      createdAt: savedUser.createdAt,
    },
  });
};

const login = async (req, res) => {
  const { error, value } = loginSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map((d) => d.message);
    const errObj = new Error('Validation failed');
    errObj.status = 400;
    errObj.details = messages;
    throw errObj;
  }

  const { email, password } = value;
  const user = await User.findOne({ email });
  const isValid = user && await bcrypt.compare(password, user.password);
  if (!isValid) {
    const errObj = new Error('Invalid credentials');
    errObj.status = 401;
    throw errObj;
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await redisClient.set(`${REFRESH_PREFIX}${refreshToken}`, user._id.toString(), {
    EX: 7 * 24 * 60 * 60,
  });

  res.status(200).json({ message: 'User login successful', accessToken, refreshToken });
};

const refresh = async (req, res) => {
  const { token: oldToken } = req.body;
  if (!oldToken) {
    const err = new Error('Refresh token missing');
    err.status = 400;
    throw err;
  }

  const payload = verifyRefreshToken(oldToken);
  const storedUserId = await redisClient.get(`${REFRESH_PREFIX}${oldToken}`);
  if (!storedUserId || storedUserId !== payload.id) {
    const err = new Error('Invalid refresh token');
    err.status = 403;
    throw err;
  }

  const user = await User.findById(payload.id);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  // Rotate token
  await redisClient.del(`${REFRESH_PREFIX}${oldToken}`);
  const newRefreshToken = generateRefreshToken(user);
  await redisClient.set(`${REFRESH_PREFIX}${newRefreshToken}`, user._id.toString(), {
    EX: 7 * 24 * 60 * 60,
  });

  const newAccessToken = generateAccessToken(user);
  res.json({ message: 'New token generated', accessToken: newAccessToken, refreshToken: newRefreshToken });
};

const logout = async (req, res) => {
  const { token } = req.body;
  if (!token) {
    const errObj = new Error('Token missing');
    errObj.status = 400;
    throw errObj;
  }

  await redisClient.del(`${REFRESH_PREFIX}${token}`);
  res.json({ message: 'Logged out successfully' });
};

module.exports = { register, login, refresh, logout };