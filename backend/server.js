import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import connectDB from './src/config/db.js';
import { swaggerUi, swaggerSpec } from './src/config/swagger.js';
import logger from './src/utils/logger.js';
import errorHandler from './src/middleware/errorHandler.js';

import authRoutes from './src/routes/v1/auth.js';
import projectRoutes from './src/routes/v1/projects.js';
import taskRoutes from './src/routes/v1/tasks.js';
import userRoutes from './src/routes/v1/users.js';
import dashboardRoutes from './src/routes/v1/dashboard.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Security & parsing middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// HTTP request logging
app.use(morgan('combined', {
  stream: { write: (message) => logger.http(message.trim()) },
}));

// Swagger docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'TaskFlow API Docs',
}));

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'TaskFlow API is running', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Centralized error handler
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`TaskFlow API running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  logger.info(`Swagger docs available at http://localhost:${PORT}/api/docs`);
});

export default app;
