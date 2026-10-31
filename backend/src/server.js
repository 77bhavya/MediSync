const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { initDatabase, getDbType } = require('./config/db');
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & CORS Configuration
const allowedOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or tests) or matching frontend
      if (!origin || origin === allowedOrigin || origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in dev, can restrict in production
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'MediSync Backend API',
    version: '1.0.0',
    project: 'College BCA Major Project',
    databaseEngine: getDbType(),
    timestamp: new Date().toISOString(),
  });
});

// Register API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/medicines', require('./routes/medicineRoutes'));
app.use('/api/schedule', require('./routes/scheduleRoutes'));
app.use('/api/doses', require('./routes/doseRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/drugs', require('./routes/drugInfoRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

const path = require('path');
const fs = require('fs');

// Serve compiled frontend in production if built
const frontendDist = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// 404 & Global Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server after DB initialization
async function startServer() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`[MediSync Server] Running on http://localhost:${PORT}`);
      console.log(`[MediSync Server] Active Database: ${getDbType().toUpperCase()}`);
    });
  } catch (err) {
    console.error('[MediSync Server] Failed to start:', err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;

