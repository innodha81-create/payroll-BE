import { Request, Response } from 'express';
import { LoginService } from '../service/login.service';
import { parseClientDetails } from '../utils/audit.utils';

export class LoginController {
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Email and password are required.'
        });
        return;
      }

      const clientDetails = parseClientDetails(req);
      const result = await LoginService.login({ email, password }, clientDetails);

      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.status(200).json({
        success: true,
        message: 'Login successful.',
        data: {
          user: result.user,
          accessToken: result.tokens.accessToken,
          tokenType: result.tokens.tokenType,
          expiresIn: result.tokens.expiresIn
        }
      });
    } catch (err: any) {
      res.status(401).json({
        success: false,
        error: err.message || 'Login failed.'
      });
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers['authorization'];
      const accessToken = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.substring(7)
        : null;

      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken || null;
      const clientDetails = parseClientDetails(req);

      const result = await LoginService.logout(accessToken, refreshToken, clientDetails);

      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Logout failed.'
      });
    }
  }

  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

      if (!refreshToken) {
        res.status(401).json({
          success: false,
          error: 'Refresh token is required.'
        });
        return;
      }

      const clientDetails = parseClientDetails(req);
      const result = await LoginService.rotateRefreshToken(refreshToken, clientDetails);

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.status(200).json({
        success: true,
        message: 'Token rotated successfully.',
        data: {
          accessToken: result.accessToken,
          tokenType: 'Bearer',
          expiresIn: result.expiresIn
        }
      });
    } catch (err: any) {
      res.status(401).json({
        success: false,
        error: err.message || 'Failed to refresh token.'
      });
    }
  }

  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          error: 'Email address is required.'
        });
        return;
      }

      const clientDetails = parseClientDetails(req);
      const origin = (req.headers.origin as string) || (req.headers.referer ? new URL(req.headers.referer as string).origin : undefined);
      const result = await LoginService.forgotPassword({ email }, clientDetails, origin);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Failed to process request.'
      });
    }
  }

  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, newPassword, confirmPassword } = req.body;

      if (!token || !newPassword || !confirmPassword) {
        res.status(400).json({
          success: false,
          error: 'Token, new password, and confirm password are required.'
        });
        return;
      }

      const clientDetails = parseClientDetails(req);
      const result = await LoginService.resetPassword(
        { token, newPassword, confirmPassword },
        clientDetails
      );

      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          user: result.user,
          accessToken: result.tokens.accessToken,
          expiresIn: result.tokens.expiresIn
        }
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Failed to reset password.'
      });
    }
  }
}
