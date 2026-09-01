import rateLimit from 'express-rate-limit';

export const sessionCreateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 session creation requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many session requests from this IP, please try again later.' }
});

export const fileUploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 50, // limit each IP to 50 upload calls
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many file upload requests from this IP, please try again later.' }
});
