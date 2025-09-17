const crypto = require('crypto');
const bcrypt = require('bcrypt');
const User = require('../models/user.model');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../utils/jwt');
const {
  registerSchema,
  forgotPasswordSchema,
  loginSchema,
} = require('../validators/auth.validator');
const redisClient = require('../config/redis');
const sendEmail = require('../utils/sendEmail');

const REFRESH_PREFIX = 'refresh:';

const register = async (req, res) => {
  const { error, value } = registerSchema.validate(req.body, {
    abortEarly: false,
  });
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

  await redisClient.set(
    `${REFRESH_PREFIX}${refreshToken}`,
    savedUser._id.toString(),
    {
      EX: 7 * 24 * 60 * 60,
    }
  );

  const token = crypto.randomBytes(32).toString('hex');
  user.emailVerificationToken = token;
  user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
  await user.save();

  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  const html = `
  <h2>Welcome to Our App</h2>
  <p>Please verify your email by clicking the link below:</p>
  <a href="${verifyUrl}">Verify Email</a>
  `;

  await sendEmail({
    to: user.email,
    from: 'info@app.com',
    subject: 'Verify Your Email',
    text: `Please verify your email by clicking the link: ${verifyUrl}`,
    html,
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

const verifyEmail = async (req, res) => {
  const { token } = req.query;
  if (!token) {
    const err = new Error('Verification token is required');
    err.status = 400;
    throw err;
  }

  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: Date.now() },
  });

  if (!user) {
    const err = new Error('Invalid or expired verification token');
    err.status = 403;
    throw err;
  }

  user.emailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  res.json({ message: 'Email verified successfully' });
};

const forgotPassword = async (req, res) => {
  const { error, value } = forgotPasswordSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    const messages = error.details.map((d) => d.message);
    const errObj = new Error('Validation failed');
    errObj.status = 400;
    errObj.details = messages;
    throw errObj;
  }

  const { email } = value;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(200).json({
      message: 'If the email exists, a reset link has been sent.',
    });
  }

  const token = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
  await user.save();

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  const html = `
    <h2>Password Reset</h2>
    <p>Click below to reset your password:</p>
    <a href="${resetUrl}">Reset Password</a>
    <p>This link expires in 1 hour.</p>
  `;

  await sendEmail({
    to: user.email,
    subject: 'Reset Your Password',
    html,
  });

  res.json({ message: 'Reset link sent if email exists.' });
};

const resendVerification = async (req, res) => {
  const { error, value } = forgotPasswordSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    const messages = error.details.map((d) => d.message);
    const errObj = new Error('Validation failed');
    errObj.status = 400;
    errObj.details = messages;
    throw errObj;
  }

  const { email } = value;
  const user = await User.findOne({ email });

  if (!user || user.emailVerified) {
    return res.status(200).json({
      message: 'Verification email sent if needed.',
    });
  }

  const token = crypto.randomBytes(32).toString('hex');
  user.emailVerificationToken = token;
  user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
  await user.save();

  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  const html = `
    <h2>Verify Your Email</h2>
    <p>Click below to verify your account:</p>
    <a href="${verifyUrl}">Verify Email</a>
  `;

  await sendEmail({
    to: user.email,
    subject: 'Verify Your Email',
    html,
  });

  res.json({ message: 'Verification email sent.' });
};

const login = async (req, res) => {
  const { error, value } = loginSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    const messages = error.details.map((d) => d.message);
    const errObj = new Error('Validation failed');
    errObj.status = 400;
    errObj.details = messages;
    throw errObj;
  }

  const { email, password } = value;
  const user = await User.findOne({ email });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    const errObj = new Error('Invalid credentials');
    errObj.status = 401;
    throw errObj;
  }

  if (!user.emailVerified) {
    const errObj = new Error('Email not verified');
    errObj.status = 403;
    throw errObj;
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await redisClient.set(
    `${REFRESH_PREFIX}${refreshToken}`,
    user._id.toString(),
    { EX: 7 * 24 * 60 * 60 } // 7 days
  );

  res.status(200).json({
    message: 'User login successful',
    accessToken,
    refreshToken,
  });
};

// Reset password and auto login
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    const errObj = new Error('Token and new password are required');
    errObj.status = 400;
    throw errObj;
  }

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    const errObj = new Error('Invalid or expired reset token');
    errObj.status = 403;
    throw errObj;
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await redisClient.set(
    `${REFRESH_PREFIX}${refreshToken}`,
    user._id.toString(),
    { EX: 7 * 24 * 60 * 60 }
  );

  res.status(200).json({
    message: 'Password reset successful',
    accessToken,
    refreshToken,
  });
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
  await redisClient.set(
    `${REFRESH_PREFIX}${newRefreshToken}`,
    user._id.toString(),
    {
      EX: 7 * 24 * 60 * 60,
    }
  );

  const newAccessToken = generateAccessToken(user);
  res.json({
    message: 'New token generated',
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  });
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

module.exports = {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resendVerification,
  resetPassword,
  refresh,
  logout,
};
