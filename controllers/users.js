const User = require('../models/user.model');
const { userSchema } = require('../validators/user.validator');
const Joi = require('joi');
const bcrypt = require('bcrypt');

// POST /users
const addUser = async (req, res) => {
  const { error, value } = userSchema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map((d) => d.message),
    });
  }

  const { username, email, password } = value;

  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    return res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        createdAt: newUser.createdAt,
      },
    });
  } catch (err) {
    console.error('Error creating user:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /users
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}, 'username email createdAt');
    return res.status(200).json({
      count: users.length,
      users,
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /users/:id
const updateUser = async (req, res) => {
  const updateSchema = Joi.object({
    username: Joi.string().min(3).max(30),
    email: Joi.string().email(),
    password: Joi.string()
      .min(8)
      .pattern(new RegExp('(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[\\W_])'))
      .messages({
        'string.pattern.base':
          'Password must include uppercase, lowercase, number, and special character',
      }),
  });

  const { error, value } = updateSchema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map((d) => d.message),
    });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (value.username && value.username !== user.username) {
      const conflict = await User.findOne({ username: value.username });
      if (conflict) {
        return res.status(409).json({ error: 'Username already in use' });
      }
    }

    if (value.email && value.email !== user.email) {
      const conflict = await User.findOne({ email: value.email });
      if (conflict) {
        return res.status(409).json({ error: 'Email already in use' });
      }
    }

    if (value.password) {
      const saltRounds = 10;
      value.password = await bcrypt.hash(value.password, saltRounds);
    }

    Object.assign(user, value);
    await user.save();

    return res.status(200).json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error('Error updating user:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /users/:id
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
      message: 'User deleted successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('Error deleting user:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  addUser,
  getUsers,
  updateUser,
  deleteUser,
};