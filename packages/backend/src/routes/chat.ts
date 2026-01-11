import { Router } from 'express';
import { ChatController } from '../controllers/chat';

export function createChatRoutes(chatController: ChatController): Router {
  const router = Router();

  router.post('/message', (req, res) => chatController.handleMessage(req, res));
  router.post('/analyze-photo', (req, res) => chatController.analyzePhoto(req, res));

  return router;
}
