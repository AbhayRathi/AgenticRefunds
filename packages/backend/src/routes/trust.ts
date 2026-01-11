import { Router } from 'express';
import { TrustController } from '../controllers/trust';

export function createTrustRoutes(trustController: TrustController): Router {
  const router = Router();

  router.post('/evaluate', (req, res) => trustController.evaluateTrust(req, res));

  return router;
}
