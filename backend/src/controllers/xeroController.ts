import { Request, Response } from 'express';
import { xeroAuthService } from '@/services/xeroAuthService';
import { xeroInvoiceService } from '@/services/xeroInvoiceService';
import { logger } from '@/logger';

export const xeroController = {
  /**
   * Admin endpoint to generate Xero connect URL and redirect
   */
  connectXero: async (req: Request, res: Response) => {
    try {
      const consentUrl = await xeroAuthService.getConsentUrl();
      
      logger.info('--- XERO DEBUG ---');
      logger.info(`Client ID being used: ${process.env.XERO_CLIENT_ID}`);
      logger.info(`Redirect URI being used: ${process.env.XERO_REDIRECT_URI}`);
      logger.info(`Generated Xero Consent URL: ${consentUrl}`);
      logger.info('------------------');
      
      res.redirect(consentUrl);
    } catch (error: any) {
      logger.error('Connect Xero Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to generate Xero connect URL' });
    }
  },

  /**
   * Callback URL for Xero to redirect to after authorization
   */
  callback: async (req: Request, res: Response) => {
    try {
      const url = req.protocol + '://' + req.get('host') + req.originalUrl;
      await xeroAuthService.handleCallback(url);
      
      // Usually redirect to an admin dashboard page indicating success
      res.status(200).json({ success: true, message: 'Successfully connected to Xero' });
    } catch (error: any) {
      logger.error('Xero Callback Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to authenticate with Xero' });
    }
  },

  /**
   * Admin endpoint to manually trigger invoice creation for testing or manual admin action
   */
  createTestInvoice: async (req: Request, res: Response) => {
    try {
      const { userId, description, quantity, unitAmount } = req.body;

      if (!userId || !description || !quantity || !unitAmount) {
        return res.status(400).json({ success: false, message: 'userId, description, quantity, and unitAmount are required' });
      }

      const invoice = await xeroInvoiceService.createInvoice(userId, [
        {
          description: description,
          quantity: quantity,
          unitAmount: unitAmount
        }
      ]);

      res.status(201).json({ success: true, message: 'Invoice created successfully', data: invoice });
    } catch (error: any) {
      logger.error('Create Test Invoice Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create invoice' });
    }
  }
};
