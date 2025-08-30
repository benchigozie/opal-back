const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10, 
  message: "Too many requests from this IP, please try again later.",
});

module.exports = authLimiter;


