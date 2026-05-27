import { Router } from 'express';
import { xeroController } from '@/controllers/xeroController';
import { isAuth, hasRole } from '@/middlewares/authMiddleware';
import { Role } from '@/enums';

const router = Router();

// OAuth Routes
router.get('/connect', xeroController.connectXero);
router.get('/callback', xeroController.callback); 

// Test/Manual Invoice Route
router.post('/test-invoice', isAuth, hasRole([Role.ADMIN]), xeroController.createTestInvoice);

export default router;
