const errorHandler = (err, req, res, next) => {
  console.error('Unhandled error:', err);

  const statusCode = err.status || 500;
  const response = {
    error: err.message || 'Internal server error',
  };

  if (err.details) {
    response.details = err.details;
  }

  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
