const Joi = require('joi');

const userSchema = Joi.object({
  username: Joi.string().min(3).max(30).required(),
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

module.exports = { userSchema };