import express from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import { MongoDBService } from './services/mongodb';
import { RAGService } from './services/rag';
import { CDPService } from './services/cdp';
import { RefundController } from './controllers/refund';
import { createRefundRoutes } from './routes/refund';
import { x402Middleware } from './middleware/x402';
import { securityMiddleware, rateLimiter } from './middleware/security';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { logger } from './config/logger';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(securityMiddleware);
app.use(rateLimiter);

// Core middleware
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info({
    method: req.method,
    path: req.path,
    ip: req.ip
  });
  next();
});

// Initialize services
let mongoService: MongoDBService;
let ragService: RAGService;
let cdpService: CDPService;
let refundController: RefundController;

async function initializeServices() {
  try {
    // MongoDB Service
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    mongoService = new MongoDBService(mongoUri);
    await mongoService.connect();
    await mongoService.insertSamplePolicies();

    // RAG Service
    const geminiApiKey = process.env.GEMINI_API_KEY || '';
    ragService = new RAGService(geminiApiKey, mongoService);

    // CDP Service
    const cdpApiKeyName = process.env.CDP_API_KEY_NAME || '';
    const cdpPrivateKey = process.env.CDP_PRIVATE_KEY || '';
    cdpService = new CDPService(cdpApiKeyName, cdpPrivateKey);
    
    // Initialize wallet if wallet ID is provided
    const walletId = process.env.CDP_WALLET_ID;
    if (walletId) {
      await cdpService.initializeWallet(walletId);
    }

    // Controllers
    refundController = new RefundController(ragService, cdpService);

    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize services:', error);
    logger.warn('Server will start but some features may not work properly');
  }
}

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    services: {
      mongodb: !!mongoService,
      rag: !!ragService,
      cdp: !!cdpService
    }
  });
});

// x402 protected route example
app.post('/api/x402-protected', 
  x402Middleware({ enabled: false }), // Disabled by default, enable via env var
  (req, res) => {
    res.json({ 
      message: 'Payment received',
      payment: (req as any).x402Payment 
    });
  }
);

// Initialize routes after services are ready
initializeServices().then(() => {
  // Refund routes
  app.use('/api/refunds', createRefundRoutes(refundController));

  // 404 handler
  app.use(notFoundHandler);

  // Error handler (must be last)
  app.use(errorHandler);

  // Start server
  app.listen(PORT, () => {
    logger.info(`🚀 Delivery Shield backend running on port ${PORT}`);
    logger.info(`📍 Health check: http://localhost:${PORT}/health`);
    logger.info(`📍 API base: http://localhost:${PORT}/api`);
  });
}).catch(error => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  if (mongoService) {
    await mongoService.disconnect();
  }
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

