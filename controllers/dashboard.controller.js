const dashboard = async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  res.json({ message: 'Welcome to the admin dashboard', user }) ;
};

module.exports = { dashboard };