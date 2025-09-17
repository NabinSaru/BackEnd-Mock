const { RateLimiterMemory } = require('rate-limiter-flexible');

const forgotLimiter = new RateLimiterMemory({
  points: 5, // max 5 requests
  duration: 15 * 60, // per 15 minutes
});

const resendLimiter = new RateLimiterMemory({
  points: 3,
  duration: 15 * 60,
});

const rateLimitMiddleware = (limiter) => {
  return async (req, res, next) => {
    try {
      const key = req.ip; // or use req.body.email for per-user limit
      await limiter.consume(key);
      next();
    } catch (rateLimiterRes) {
      res.set('Retry-After', String(Math.ceil(rateLimiterRes.msBeforeNext / 1000)));
      return res.status(429).json({
        error: 'Too many requests. Please try again later.',
      });
    }
  };
};

module.exports = {
  forgotPasswordLimiter: rateLimitMiddleware(forgotLimiter),
  resendVerificationLimiter: rateLimitMiddleware(resendLimiter),
};