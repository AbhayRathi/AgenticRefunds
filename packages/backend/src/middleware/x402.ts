import { Request, Response, NextFunction } from 'express';
import { X402Request, X402Response } from '@delivery-shield/shared';

export interface X402MiddlewareConfig {
  enabled: boolean;
  requiredAmount?: string;
  requiredCurrency?: string;
}

export const x402Middleware = (config: X402MiddlewareConfig) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!config.enabled) {
      return next();
    }

    const x402Header = req.headers['x-402-payment'] as string;
    
    if (!x402Header) {
      const x402Response: X402Response = {
        success: false,
        error: 'Payment required. Please include x-402-payment header.'
      };
      return res.status(402).json(x402Response);
    }

    try {
      const payment: X402Request = JSON.parse(x402Header);
      
      // Validate payment
      if (!payment.payment || !payment.payment.amount) {
        throw new Error('Invalid payment format');
      }

      // Attach payment info to request
      (req as any).x402Payment = payment;
      
      next();
    } catch (error) {
      const x402Response: X402Response = {
        success: false,
        error: 'Invalid x-402-payment header format'
      };
      return res.status(400).json(x402Response);
    }
  };
};
