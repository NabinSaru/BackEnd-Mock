const Joi = require('joi');

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(new RegExp('(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[\\W_])'))
    .required()
    .messages({
      'string.pattern.base':
        'Password must include uppercase, lowercase, number, and special character',
    }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

module.exports = { registerSchema, forgotPasswordSchema, loginSchema };