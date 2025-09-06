const User = require('../models/user.model');

const isValidPassword = (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
  return passwordRegex.test(password);
};

const addUser = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({
      error: 'Missing required fields: username, email, and password',
    });
  }

  if (!isValidPassword(password)) {
    return res.status(400).json({
      error: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character',
    });
  }

  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(409).json({
        error: 'Username or email already exists',
      });
    }

    const newUser = new User({ username, email, password });
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
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
};

// GET /users
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}, 'username email createdAt'); // exclude password
    return res.status(200).json({
      count: users.length,
      users,
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
};

module.exports = {
  addUser,
  getUsers,
};