const path = require('path');

// Third-party imports
const compression = require('compression');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');

// Routers
const employeeRouter = require('./routes/employeeRoutes');
const floorRouter = require('./routes/floorRoutes');
const orderRouter = require('./routes/orderRoutes');
const roomRouter = require('./routes/roomRoutes');
const userRouter = require('./routes/userRoutes');
const visitorRouter = require('./routes/visitorRoutes');
const voucherRouter = require('./routes/voucherRoutes');

// Utils
const AppError = require('./utils/appError');
const errorMiddleware = require('./middlewares/errorMiddleware');

// Init app
const app = express();

// ---------------------
// 🚀 CORS FIX FOR PRODUCTION
// ---------------------
app.use(cors({
  origin: process.env.CLIENT_SIDE_URL,   // frontend vercel URL
  credentials: true                      // allow cookies
}));

app.options('*', cors({
  origin: process.env.CLIENT_SIDE_URL,
  credentials: true
}));

// Trust proxy (Render uses reverse proxy)
app.enable("trust proxy");

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Security headers
app.use(helmet());

// Body parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Sanitization
app.use(mongoSanitize());
app.use(xss());

// Prevent HTTP parameter pollution
app.use(hpp());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Compression
app.use(compression());

// Rate Limiter
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests! Please try again in an hour!',
});
app.use('/api', limiter);

// ---------------------
// API ROUTES
// ---------------------
app.use('/api/v1/employees', employeeRouter);
app.use('/api/v1/floors', floorRouter);
app.use('/api/v1/orders', orderRouter);
app.use('/api/v1/rooms', roomRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/visitors', visitorRouter);
app.use('/api/v1/vouchers', voucherRouter);

// Test Route
app.get('/api/test', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Backend is connected successfully 🚀'
  });
});

// Handle undefined routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Error handler
app.use(errorMiddleware);

module.exports = app;
