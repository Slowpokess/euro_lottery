const express = require('express');
const cors = require('cors');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const connectDB = require('./config/db');
const createAdminUser = require('./utils/seedAdmin');

// Routes
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const equipmentRoutes = require('./routes/equipment');
const newsRoutes = require('./routes/news');
const rentRequestRoutes = require('./routes/rentRequests');
const residentRoutes = require('./routes/residents');
const spaceRoutes = require('./routes/spaces');
const promotionRoutes = require('./routes/promotions');
const promotionContactRoutes = require('./routes/promotionContacts');

// Mock data for development without database
const mockData = require('./utils/mockData');

// Initialize app
const app = express();

// Global variable to track database connection status
let dbConnected = false;

// Log environment mode
console.log(`Environment: ${process.env.NODE_ENV}`);

// Try to connect to the database in the background
setTimeout(() => {
  connectDB().then((conn) => {
    if (conn) {
      console.log('MongoDB database connected');
      dbConnected = true;
      
      // Создаем администратора, если его еще нет
      try {
        createAdminUser().catch(err => {
          console.error('Error creating admin user:', err.message);
        });
      } catch (error) {
        console.error('Failed to initialize admin user:', error);
      }
    }
  }).catch(err => {
    console.error('Database connection error:', err.message);
    console.log('Continuing to use mock data for development');
  });
}, 1000);

// Enhanced security with helmet (if in production)
if (process.env.NODE_ENV === 'production') {
  app.use(helmet());
  
  // Set security headers
  app.use(helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https://collider-club.com", "https://*.collider-club.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https://collider-club.com", "https://*.collider-club.com"]
    }
  }));
  
  // Add rate limiting
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes'
  });
  app.use('/api/', apiLimiter);
}

// Enhance security with mongo-sanitize to prevent NoSQL injection
app.use(mongoSanitize());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// JSON and form parsing with larger limits for file uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Add gzip compression
app.use(compression());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
});

// Cache duration configuration (in seconds)
const CACHE_DURATIONS = {
  STATIC: 60 * 60 * 24 * 7, // 1 week for static assets
  IMAGES: 60 * 60 * 24 * 30, // 30 days for images
  DEFAULT: 60 * 60 * 24      // 1 day default
};

// Static files with caching
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: CACHE_DURATIONS.IMAGES * 1000, // Convert to milliseconds
  etag: true,
  lastModified: true
}));

// Default images with caching
app.use('/images', express.static(path.join(__dirname, 'public/images'), {
  maxAge: CACHE_DURATIONS.IMAGES * 1000,
  etag: true,
  lastModified: true
}));

// Middleware for mock data connection if DB is unavailable
app.use((req, res, next) => {
  // Add DB connection flag to request for use in controllers
  req.dbConnected = dbConnected;
  
  // If this is an API request and database is not connected
  if (!dbConnected && req.path.startsWith('/api/')) {
    console.log(`Using mock data for request ${req.method} ${req.path}`);
    
    const mockPaths = {
      '/api/promotions': 'promotions',
      '/api/promotion-contacts': 'promotionContacts',
      '/api/events': 'events',
      '/api/equipment': 'equipment', 
      '/api/news': 'news',
      '/api/rent-requests': 'rentRequests',
      '/api/residents': 'residents',
      '/api/spaces': 'spaces'
    };
    
    // Check all paths for a match
    for (const [path, controllerName] of Object.entries(mockPaths)) {
      // Check for exact path or subpath (/path/123)
      if (req.path === path || req.path.startsWith(`${path}/`)) {
        console.log(`Found handler for ${req.path} => ${controllerName}`);
        
        try {
          if (req.method === 'GET' && req.path === path) {
            return mockData.controllers[controllerName].getAll(req, res);
          } else if (req.method === 'GET' && req.path.match(new RegExp(`^${path}/[^/]+$`))) {
            return mockData.controllers[controllerName].getById(req, res);
          } else if (req.method === 'POST' && req.path === path) {
            return mockData.controllers[controllerName].create(req, res);
          } else if (req.method === 'PUT' && req.path.match(new RegExp(`^${path}/[^/]+$`))) {
            return mockData.controllers[controllerName].update(req, res);
          } else if (req.method === 'DELETE' && req.path.match(new RegExp(`^${path}/[^/]+$`))) {
            return mockData.controllers[controllerName].delete(req, res);
          }
        } catch (error) {
          console.error(`Error processing mock data: ${error.message}`);
          return res.status(500).json({
            success: false,
            error: 'Server error',
            message: 'Error processing mock data'
          });
        }
      }
    }
    
    // If path not found but this is an API request, return empty array for GET and success for others
    if (req.method === 'GET') {
      console.log(`Path ${req.path} not found in mock data, returning empty array`);
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    } else {
      console.log(`Path ${req.path} not found in mock data, returning success response`);
      return res.status(200).json({
        success: true,
        data: {}
      });
    }
  }
  
  // If database is connected, continue to next middleware
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/rent-requests', rentRequestRoutes);
app.use('/api/residents', residentRoutes);
app.use('/api/spaces', spaceRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/promotion-contacts', promotionContactRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../build')));

  // Handle any requests that don't match the ones above
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../', 'build', 'index.html'));
  });
}

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  // Log error details for debugging (not sensitive data)
  console.error(`[ERROR] ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  } else {
    console.error(`${err.name}: ${err.message}`);
  }
  
  // ErrorResponse instance - use its built-in formatting
  if (err instanceof require('./utils/errorResponse')) {
    return res.status(err.statusCode).json(err.toJSON());
  }
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      localizedError: 'Ошибка валидации данных',
      details: messages
    });
  }
  
  // Duplicate key error
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      error: 'Duplicate key error',
      localizedError: 'Запись с таким ключевым полем уже существует'
    });
  }
  
  // Invalid MongoDB ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(404).json({
      success: false,
      error: 'Resource not found',
      localizedError: 'Ресурс не найден'
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      localizedError: 'Недействительный токен'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expired',
      localizedError: 'Срок действия токена истек'
    });
  }
  
  // Multer file upload errors
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      error: `File upload error: ${err.message}`,
      localizedError: `Ошибка загрузки файла: ${err.message}`
    });
  }
  
  // Default server error
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: 'Server error',
    localizedError: 'Ошибка сервера',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Port
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});