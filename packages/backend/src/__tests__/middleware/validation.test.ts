import request from 'supertest';
import express from 'express';
import { validateRequest } from '../../middleware/validation';
import { SimulationRequestSchema } from '../../validators/refund.validators';

describe('Validation Middleware', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Test route with validation
    app.post('/test', validateRequest(SimulationRequestSchema), (req, res) => {
      res.json({ success: true, data: req.body });
    });
  });

  it('should pass validation with valid data', async () => {
    const response = await request(app)
      .post('/test')
      .send({ issueType: 'LATE_DELIVERY' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.issueType).toBe('LATE_DELIVERY');
  });

  it('should return 400 for invalid data', async () => {
    const response = await request(app)
      .post('/test')
      .send({ issueType: 'INVALID' })
      .expect(400);

    expect(response.body.error).toBe('Validation failed');
    expect(response.body.details).toBeDefined();
  });

  it('should return 400 for missing required fields', async () => {
    const response = await request(app)
      .post('/test')
      .send({})
      .expect(400);

    expect(response.body.error).toBe('Validation failed');
  });
});
