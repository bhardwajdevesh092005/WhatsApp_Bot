import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import dashboardRoutes from './src/routes/dashboard.js';
import messageRoutes from './src/routes/messages.js';
import analyticsRoutes from './src/routes/analytics.js';
import settingsRoutes from './src/routes/settings.js';
import botRoutes from './src/routes/bot.js';
import healthRoutes from './src/routes/health.js';
import llmRoutes from './src/routes/llm.js';

// Import services
import { WhatsAppService } from './src/services/whatsapp.js';
import { SocketService } from './src/services/socket.js';
import { DataService } from './src/services/data.js';
import MongoDataService from './src/services/mongoDataService.js';
import databaseService from './src/config/database.js';

// Import middleware
import { errorHandler } from './src/middleware/errorHandler.js';
import { requestLogger } from './src/middleware/requestLogger.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Global variables for services
let whatsappService;
let socketService;
let dataService;

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use(requestLogger);

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize services
const initializeServices = async () => {
  try {
    console.log('Initializing services...');
    
    // Connect to MongoDB first
    await databaseService.connect();
    
    // Initialize data service (MongoDB or fallback to file-based)
    const useMongoDb = process.env.MONGODB_URI || process.env.USE_MONGODB === 'true';
    
    if (useMongoDb) {
      console.log('Using MongoDB for data storage...');
      dataService = new MongoDataService();
      await dataService.initialize();
    } else {
      console.log('📁 Using file-based data storage...');
      dataService = new DataService();
      await dataService.initialize();
    }
    
    // Initialize socket service
    socketService = new SocketService(io);
    
    // Initialize WhatsApp service
    whatsappService = new WhatsAppService(socketService, dataService);
    await whatsappService.initialize();
    
    console.log('All services initialized successfully');
    
    // Make services avail  able globally
    app.locals.whatsappService = whatsappService;
    app.locals.socketService = socketService;
    app.locals.dataService = dataService;
    app.locals.databaseService = databaseService;
    
  } catch (error) {
    console.error(' Failed to initialize services:', error);
    
    // Fallback to file-based storage if MongoDB fails
    if (error.message.includes('MongoDB')) {
      console.log('MongoDB connection failed, falling back to file-based storage...');
      try {
        dataService = new DataService();
        await dataService.initialize();
        
        socketService = new SocketService(io);
        whatsappService = new WhatsAppService(socketService, dataService);
        await whatsappService.initialize();
        
        app.locals.whatsappService = whatsappService;
        app.locals.socketService = socketService;
        app.locals.dataService = dataService;
        
        console.log('Services initialized with file-based storage');
      } catch (fallbackError) {
        console.error(' Failed to initialize even with fallback:', fallbackError);
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }
};

// API Routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/bot', botRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/llm', llmRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'WhatsApp Bot API Server',
    version: '1.0.0',
    status: 'running',
    documentation: '/api/health',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'WhatsApp Bot API',
    version: '1.0.0',
    status: 'healthy',
    endpoints: {
      dashboard: '/api/dashboard',
      messages: '/api/messages',
      analytics: '/api/analytics',
      settings: '/api/settings',
      bot: '/api/bot',
      health: '/api/health'
    },
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Handle 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `The endpoint ${req.originalUrl} does not exist.`,
    availableEndpoints: [
      '/api/dashboard',
      '/api/messages',
      '/api/analytics',
      '/api/settings',
      '/api/bot',
      '/api/health'
    ]
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(` Client connected: ${socket.id}`);
  if (socketService) {
    socketService.handleConnection(socket);
  }
  
  socket.on('disconnect', (reason) => {
    console.log(` Client disconnected: ${socket.id} (${reason})`);
    if (socketService) {
      socketService.handleDisconnection(socket);
    }
  });
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
  
  // Close HTTP server
  server.close(async () => {
    console.log('HTTP server closed');
    
    // Clean up services
    if (whatsappService) {
      await whatsappService.cleanup();
      console.log('WhatsApp service cleaned up');
    }
    
    if (dataService) {
      await dataService.cleanup?.();
      console.log('Data service cleaned up');
    }
    
    if (databaseService) {
      await databaseService.disconnect();
      console.log('Database connection closed');
    }
    
    console.log('Graceful shutdown completed');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error(' Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error(' Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(' Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Start server
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || 'localhost';

const startServer = async () => {
  try {
    await initializeServices();
    
    server.listen(PORT, HOST, () => {
      console.log(`WhatsApp Bot API Server is running on http://${HOST}:${PORT}`);
      console.log(`Dashboard API: http://${HOST}:${PORT}/api/dashboard`);
      console.log(`Messages API: http://${HOST}:${PORT}/api/messages`);
      console.log(`Analytics API: http://${HOST}:${PORT}/api/analytics`);
      console.log(`Settings API: http://${HOST}:${PORT}/api/settings`);
      console.log(`Bot API: http://${HOST}:${PORT}/api/bot`);
      console.log(`Health Check: http://${HOST}:${PORT}/api/health`);
      console.log(`WebSocket Server: ws://${HOST}:${PORT}`);
    });
  } catch (error) {
    console.error(' Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
