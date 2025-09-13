const { RateLimiterRedis } = require('rate-limiter-flexible');
const Redis = require('redis');

const redisClient = Redis.createClient();

const loginLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'login_fail',
  points: 5,
  duration: 60 * 15,
  blockDuration: 60 * 30,
});

const limitLoginAttempts = async (req, res, next) => {
  const key = req.ip;

  try {
    await loginLimiter.consume(key);
    next();
  } catch (err) {
    console.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many login attempts. Try again later.',
      retryAfter: `${Math.ceil(err.msBeforeNext / 1000)} seconds`,
    });
  }
};

module.exports = { limitLoginAttempts };