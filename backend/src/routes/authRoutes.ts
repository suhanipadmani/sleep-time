import { Router } from 'express';
import { 
  seedAdmin, 
  login, 
  forgotPassword, 
  resetPassword, 
  changePassword, 
  getProfile, 
  updateProfile,
  refreshToken 
} from '@/controllers/authController';
import { validateRequest } from '@/middlewares/validateRequest';
import { isAuth } from '@/middlewares/authMiddleware';
import { 
  loginSchema, 
  forgotPasswordSchema, 
  resetPasswordSchema, 
  changePasswordSchema, 
  updateProfileSchema,
  refreshTokenSchema
} from '@/validations/auth.validation';

const router = Router();

router.post('/seed-admin', seedAdmin);
router.post('/login', validateRequest(loginSchema), login);
router.post('/refresh', validateRequest(refreshTokenSchema), refreshToken);
router.post('/forgot-password', validateRequest(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validateRequest(resetPasswordSchema), resetPassword);
router.post('/change-password', isAuth, validateRequest(changePasswordSchema), changePassword);

router.get('/profile', isAuth, getProfile);
router.put('/profile', isAuth, validateRequest(updateProfileSchema), updateProfile);

export default router;
