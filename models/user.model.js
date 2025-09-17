const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    username: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    bio: {
      type: String,
      maxlength: 300,
    },
    avatarUrl: {
      type: String,
      validate: {
        validator: (v) =>
          !v || /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/.test(v),
        message: 'Invalid image URL',
      },
    },
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    emailVerificationExpires: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
