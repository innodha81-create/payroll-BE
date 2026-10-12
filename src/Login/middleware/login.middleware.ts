import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, AccessTokenPayload } from '../utils/token.utils';
import { pool } from '../../database/db';

export interface AuthenticatedRequest extends Request {
  user?: AccessTokenPayload;
}

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : null;

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Access denied. No authentication token provided.'
    });
    return;
  }

  try {
    const payload = verifyAccessToken(token);

    // Instant Blacklist Check (Logout Revocation)
    const blacklistCheck = await pool.query(
      'SELECT 1 FROM token_blacklist WHERE jti = $1 AND expires_at > NOW()',
      [payload.jti]
    );

    if (blacklistCheck.rowCount && blacklistCheck.rowCount > 0) {
      res.status(401).json({
        success: false,
        error: 'Token has been revoked/blacklisted. Please log in again.'
      });
      return;
    }

    req.user = payload;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        error: 'Token has expired. Please refresh your session.'
      });
      return;
    }

    res.status(403).json({
      success: false,
      error: 'Invalid or tampered authentication token.'
    });
  }
}

export function requireRoles(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Forbidden. Requires one of the following roles: ${roles.join(', ')}`
      });
      return;
    }
    next();
  };
}
