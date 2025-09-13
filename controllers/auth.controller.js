const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../utils/jwt');
const { registerSchema, loginSchema } = require('../validators/auth.validator');
const redisClient = require('../config/redis'); // assumes you’ve set up a Redis client

const REFRESH_PREFIX = 'refresh:';

const register = async (req, res) => {
  const { error, value } = registerSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details.map((d) => d.message) });
  }

  const { email, password } = value;
  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = new User({ email, password: hashed });
  await user.save();

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await redisClient.set(`${REFRESH_PREFIX}${refreshToken}`, user._id.toString(), {
    EX: 7 * 24 * 60 * 60, // 7 days
  });

  res.status(201).json({ accessToken, refreshToken });
};

const login = async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details.map((d) => d.message) });
  }

  const { email, password } = value;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await redisClient.set(`${REFRESH_PREFIX}${refreshToken}`, user._id.toString(), {
    EX: 7 * 24 * 60 * 60,
  });

  res.status(200).json({ accessToken, refreshToken });
};

const refresh = async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Refresh token missing' });
  }

  try {
    const payload = verifyRefreshToken(token);
    const storedUserId = await redisClient.get(`${REFRESH_PREFIX}${token}`);
    if (!storedUserId || storedUserId !== payload.id) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    const user = await User.findById(payload.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newAccessToken = generateAccessToken(user);
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    return res.status(403).json({ error: 'Token expired or invalid' });
  }
};

const logout = async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token missing' });

  await redisClient.del(`${REFRESH_PREFIX}${token}`);
  res.json({ message: 'Logged out successfully' });
};

module.exports = { register, login, refresh, logout };