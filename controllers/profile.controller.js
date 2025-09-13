const User = require('../models/user.model');

const getProfile = async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  res.json({ user });
};

const updateProfile = async (req, res) => {
  const updates = req.body;

  const allowedFields = ['username', 'bio', 'avatarUrl'];
  const filteredUpdates = Object.fromEntries(
    Object.entries(updates).filter(([key]) => allowedFields.includes(key))
  );

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $set: filteredUpdates },
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  res.json({ message: 'Profile updated', user });
};

module.exports = { getProfile, updateProfile };
