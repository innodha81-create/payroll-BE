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

import { LoginModel } from '../model/login.model';

// Protected Verification Endpoint
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user?.sub ? await LoginModel.findUserById(req.user.sub) : null;
    res.status(200).json({
      success: true,
      message: 'Session is active and valid.',
      data: {
        user: user
          ? {
              id: user.id,
              email: user.email,
              firstName: user.first_name,
              lastName: user.last_name,
              role: user.role
            }
          : req.user
      }
    });
  } catch {
    res.status(200).json({
      success: true,
      message: 'Session is active and valid.',
      data: {
        user: req.user
      }
    });
  }
});

export default router;
