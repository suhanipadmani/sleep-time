import { Router } from 'express';
import authRoutes from '@/routes/authRoutes';
import xeroRoutes from '@/routes/xeroRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/xero', xeroRoutes);

export default router;
