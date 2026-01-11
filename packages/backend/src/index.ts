import express from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import { MongoDBService } from './services/mongodb';
import { RAGService } from './services/rag';
import { CDPService } from './services/cdp';
import { RefundController } from './controllers/refund';
import { ChatController } from './controllers/chat';
import { TrustController } from './controllers/trust';
import { createRefundRoutes } from './routes/refund';
import { createChatRoutes } from './routes/chat';
import { createTrustRoutes } from './routes/trust';
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
let chatController: ChatController;
const trustController = new TrustController();

function validateEnvironment(): void {
  const required = [
    'MONGODB_URI',
    'GEMINI_API_KEY',
  ];

  // CDP credentials are optional - demo will use fallbacks for refund processing
  const optional = [
    'CDP_API_KEY_NAME',
    'CDP_PRIVATE_KEY'
  ];

  const missing = required.filter(key => !process.env[key] || process.env[key] === '');

  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(', ')}`);
    logger.error('Please copy .env.example to .env and fill in all values');
    process.exit(1);
  }

  const missingOptional = optional.filter(key => !process.env[key] || process.env[key] === '');
  if (missingOptional.length > 0) {
    logger.warn(`Optional environment variables not set: ${missingOptional.join(', ')} - CDP features will use fallbacks`);
  }

  // Validate MongoDB URI format
  const mongoUri = process.env.MONGODB_URI!;
  if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
    logger.error('Invalid MONGODB_URI format');
    process.exit(1);
  }

  logger.info('Environment validation passed ✓');
}

async function initializeServices() {
  try {
    validateEnvironment();
    
    // MongoDB Service
    const mongoUri = process.env.MONGODB_URI!;
    mongoService = new MongoDBService(mongoUri);
    await mongoService.connect();
    await mongoService.insertSamplePolicies();

    // RAG Service
    const geminiApiKey = process.env.GEMINI_API_KEY!;
    ragService = new RAGService(geminiApiKey, mongoService);

    // CDP Service (optional - only initialize if credentials provided)
    const cdpApiKeyName = process.env.CDP_API_KEY_NAME;
    const cdpPrivateKey = process.env.CDP_PRIVATE_KEY;
    if (cdpApiKeyName && cdpPrivateKey) {
      cdpService = new CDPService(cdpApiKeyName, cdpPrivateKey);

      // Initialize wallet if wallet ID is provided
      const walletId = process.env.CDP_WALLET_ID;
      if (walletId) {
        await cdpService.initializeWallet(walletId);
      }
      logger.info('CDP Service initialized');
    } else {
      logger.warn('CDP credentials not provided - refund processing will use fallbacks');
    }

    // Controllers (cdpService may be undefined if not configured)
    refundController = new RefundController(ragService, cdpService);
    chatController = new ChatController(ragService);

    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize services:', error);
    logger.warn('Server will start but some features may not work properly');
  }
}

// Health check
app.get('/health', async (req, res) => {
  const health: any = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {}
  };
  
  // Check MongoDB
  try {
    if (mongoService) {
      const collection = await mongoService.getPoliciesCollection();
      await collection.findOne({});
      health.services.mongodb = 'healthy';
    } else {
      health.services.mongodb = 'not initialized';
    }
  } catch (error) {
    health.services.mongodb = 'error';
    health.status = 'degraded';
  }
  
  // Check CDP
  try {
    if (cdpService) {
      const balance = await cdpService.getBalance('usdc');
      health.services.cdp = 'healthy';
      health.services.cdpBalance = balance;
    } else {
      health.services.cdp = 'not initialized';
    }
  } catch (error) {
    health.services.cdp = 'error';
    health.status = 'degraded';
  }
  
  // Check RAG/Gemini
  health.services.rag = ragService ? 'initialized' : 'not initialized';
  
  res.json(health);
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

  // Chat routes
  app.use('/api/chat', createChatRoutes(chatController));

  // Trust routes
  app.use('/api/trust', createTrustRoutes(trustController));

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

