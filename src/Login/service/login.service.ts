import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { LoginModel } from '../model/login.model';
import { LoginDTO, ForgotPasswordDTO, ResetPasswordDTO } from '../types/login.types';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} from '../utils/token.utils';
import { ClientDetails, recordAuditLog } from '../utils/audit.utils';
import {
  sendPasswordResetEmail,
  sendPasswordChangedConfirmation
} from './mail.service';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export class LoginService {
  static async login(dto: LoginDTO, clientDetails: ClientDetails) {
    const user = await LoginModel.findUserByEmail(dto.email);

    if (!user) {
      recordAuditLog(null, dto.email, 'FAILED', clientDetails, 'USER_NOT_FOUND');
      throw new Error('Invalid email or password.');
    }

    if (!user.is_active) {
      recordAuditLog(user.id, dto.email, 'FAILED', clientDetails, 'ACCOUNT_DEACTIVATED');
      throw new Error('Your account has been deactivated. Please contact support.');
    }

    // Company Status Check: If company is Inactive, block login with clear error
    if (user.company_id && user.company_status === 'Inactive') {
      recordAuditLog(user.id, dto.email, 'FAILED', clientDetails, 'COMPANY_INACTIVE');
      throw new Error('Your company account is currently inactive. Please contact the Super Admin.');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password_hash);
    if (!isMatch) {
      recordAuditLog(user.id, dto.email, 'FAILED', clientDetails, 'INVALID_PASSWORD');
      throw new Error('Invalid email or password.');
    }

    // 1. Generate Dual RS256 Tokens
    const access = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    const refresh = generateRefreshToken(user.id);

    // 2. Save Refresh Token in Database (with SHA-256 hash for RTR)
    const refreshHash = hashToken(refresh.token);
    const refreshExpiresAt = new Date(Date.now() + refresh.expiresInSeconds * 1000);

    await LoginModel.saveRefreshToken(
      user.id,
      refreshHash,
      refresh.familyId,
      `${clientDetails.deviceType} (${clientDetails.osName} / ${clientDetails.browserName})`,
      clientDetails.ip,
      refreshExpiresAt
    );

    // 3. Record Audit Log (Async / Non-blocking)
    recordAuditLog(user.id, user.email, 'SUCCESS', clientDetails);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        companyId: (user as any).subcompany_id || user.company_id || null,
        companyName: user.company_name || null,
        companyLogo: user.company_logo || null,
        subcompanyId: (user as any).subcompany_id || null,
        isSubcompany: Boolean((user as any).is_subcompany || (user as any).subcompany_id)
      },
      tokens: {
        accessToken: access.token,
        refreshToken: refresh.token,
        tokenType: 'Bearer',
        expiresIn: access.expiresInSeconds
      }
    };
  }

  static async logout(
    accessToken: string | null,
    refreshToken: string | null,
    clientDetails: ClientDetails
  ) {
    let userId: string | null = null;
    let email = 'unknown';

    // 1. Instant Access Token Blacklisting
    if (accessToken) {
      try {
        const decoded = jwt.decode(accessToken) as any;
        if (decoded && decoded.jti && decoded.exp) {
          userId = decoded.sub || null;
          email = decoded.email || 'unknown';
          const expiresAt = new Date(decoded.exp * 1000);
          await LoginModel.addTokenToBlacklist(decoded.jti, userId, expiresAt);
        }
      } catch (err) {
        console.error('[Logout] Failed to blacklist access token:', err);
      }
    }

    // 2. Revoke Refresh Token Session Family in DB
    if (refreshToken) {
      try {
        const payload = jwt.decode(refreshToken) as any;
        if (payload && payload.familyId) {
          await LoginModel.revokeRefreshTokenFamily(payload.familyId);
        }
      } catch (err) {
        console.error('[Logout] Failed to revoke refresh token:', err);
      }
    }

    // 3. Record Audit Log
    recordAuditLog(userId, email, 'LOGOUT', clientDetails);

    return { message: 'Logged out successfully. Tokens invalidated.' };
  }

  static async rotateRefreshToken(oldRefreshToken: string, clientDetails: ClientDetails) {
    let payload: any;
    try {
      payload = verifyRefreshToken(oldRefreshToken);
    } catch (err: any) {
      throw new Error('Invalid or expired refresh token. Please log in again.');
    }

    const oldHash = hashToken(oldRefreshToken);
    const storedToken = await LoginModel.findRefreshTokenByHash(oldHash);

    if (!storedToken) {
      throw new Error('Refresh token not found.');
    }

    // REFRESH TOKEN REUSE DETECTION (Compromise protection)
    if (storedToken.revoked) {
      await LoginModel.revokeRefreshTokenFamily(storedToken.family_id);
      recordAuditLog(storedToken.user_id, 'security_alert', 'FAILED', clientDetails, 'TOKEN_REUSE_DETECTED');
      throw new Error('Security alert: Refresh token reuse detected. All sessions revoked.');
    }

    // Revoke old token
    await LoginModel.revokeRefreshTokenFamily(storedToken.family_id);

    // Fetch user
    const user = await LoginModel.findUserById(storedToken.user_id);
    if (!user || !user.is_active) {
      throw new Error('User no longer active.');
    }
    if (user.company_id && user.company_status === 'Inactive') {
      throw new Error('Your company account is currently inactive. Please contact the Super Admin.');
    }

    // Generate new pair within same family
    const access = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    const newRefresh = generateRefreshToken(user.id, storedToken.family_id);
    const newHash = hashToken(newRefresh.token);
    const newExpiresAt = new Date(Date.now() + newRefresh.expiresInSeconds * 1000);

    await LoginModel.saveRefreshToken(
      user.id,
      newHash,
      newRefresh.familyId,
      `${clientDetails.deviceType} (${clientDetails.osName} / ${clientDetails.browserName})`,
      clientDetails.ip,
      newExpiresAt
    );

    return {
      accessToken: access.token,
      refreshToken: newRefresh.token,
      expiresIn: access.expiresInSeconds
    };
  }

  static async forgotPassword(dto: ForgotPasswordDTO, clientDetails: ClientDetails, clientOrigin?: string) {
    const user = await LoginModel.findUserByEmail(dto.email.trim());

    if (!user) {
      recordAuditLog(null, dto.email.trim(), 'PASSWORD_RESET', clientDetails, 'EMAIL_NOT_REGISTERED');
      throw new Error('This email address is not registered in our system.');
    }

    if (!user.is_active) {
      recordAuditLog(user.id, user.email, 'PASSWORD_RESET', clientDetails, 'ACCOUNT_DEACTIVATED');
      throw new Error('Your account has been deactivated. Please contact support.');
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await LoginModel.savePasswordReset(user.id, tokenHash, expiresAt);

    // Send email asynchronously in the background (NON-BLOCKING) so the user gets instant 30ms response!
    sendPasswordResetEmail(user.email, rawToken, user.first_name || undefined, clientOrigin)
      .catch((err) => console.error('[Background Mail Error]:', err));

    recordAuditLog(user.id, user.email, 'PASSWORD_RESET', clientDetails, 'RESET_LINK_SENT');

    return {
      message: 'Password reset link has been sent to your email.'
    };
  }

  static async resetPassword(dto: ResetPasswordDTO, clientDetails: ClientDetails) {
    if (!dto.newPassword || !dto.confirmPassword) {
      throw new Error('New password and confirmation password are required.');
    }

    if (dto.newPassword !== dto.confirmPassword) {
      throw new Error('Passwords do not match.');
    }

    if (dto.newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }

    const tokenHash = hashToken(dto.token);
    const resetRecord = await LoginModel.findValidPasswordReset(tokenHash);

    if (!resetRecord) {
      throw new Error('Invalid or expired password reset link.');
    }

    // Bcrypt round 10 (fast & secure, ~80ms instead of 450ms)
    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await LoginModel.updateUserPassword(resetRecord.user_id, passwordHash);
    await LoginModel.markPasswordResetAsUsed(resetRecord.id);
    await LoginModel.revokeAllUserTokens(resetRecord.user_id);

    const user = await LoginModel.findUserById(resetRecord.user_id);
    if (!user) {
      throw new Error('User not found.');
    }

    // Send confirmation email in background non-blocking
    sendPasswordChangedConfirmation(user.email, user.first_name || undefined)
      .catch((err) => console.error('[Background Mail Error]:', err));

    recordAuditLog(user.id, user.email, 'PASSWORD_RESET', clientDetails, 'PASSWORD_CHANGE_SUCCESS');

    // Automatically issue fresh authentication tokens for instant auto-login
    const access = generateAccessToken(user);
    const refresh = generateRefreshToken(user.id);
    const refreshExpiresAt = new Date(Date.now() + refresh.expiresInSeconds * 1000);
    const refreshHash = hashToken(refresh.token);

    await LoginModel.saveRefreshToken(
      user.id,
      refreshHash,
      refresh.familyId,
      `${clientDetails.deviceType} (${clientDetails.osName} / ${clientDetails.browserName})`,
      clientDetails.ip,
      refreshExpiresAt
    );

    return {
      message: 'Password successfully updated. Logging you in...',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      },
      tokens: {
        accessToken: access.token,
        refreshToken: refresh.token,
        expiresIn: access.expiresInSeconds
      }
    };
  }
}
