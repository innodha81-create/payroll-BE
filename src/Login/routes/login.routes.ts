import { Router } from 'express';
import { LoginController } from '../controller/login.controller';
import { authenticateToken, AuthenticatedRequest } from '../middleware/login.middleware';

const router = Router();

// Public Authentication Endpoints
router.post('/login', LoginController.login);
router.post('/logout', LoginController.logout);
router.post('/refresh-token', LoginController.refreshToken);
router.post('/forgot-password', LoginController.forgotPassword);
router.post('/reset-password', LoginController.resetPassword);

// Protected Verification Endpoint
router.get('/me', authenticateToken, (req: AuthenticatedRequest, res) => {
  res.status(200).json({
    success: true,
    message: 'Session is active and valid.',
    data: {
      user: req.user
    }
  });
});

export default router;
