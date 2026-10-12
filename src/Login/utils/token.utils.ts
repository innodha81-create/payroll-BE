import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PRIVATE_KEY, PUBLIC_KEY } from './keys';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: string;
  jti: string;
}

export interface RefreshTokenPayload {
  sub: string;
  familyId: string;
  jti: string;
}

export function generateAccessToken(user: { id: string; email: string; role: string }): { token: string; jti: string; expiresInSeconds: number } {
  const jti = crypto.randomUUID();
  const expiresInSeconds = 15 * 60; // 15 minutes

  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      jti
    },
    PRIVATE_KEY,
    {
      algorithm: 'RS256',
      expiresIn: '15m',
      issuer: 'icomply-auth'
    }
  );

  return { token, jti, expiresInSeconds };
}

export function generateRefreshToken(userId: string, familyId?: string): { token: string; jti: string; familyId: string; expiresInSeconds: number } {
  const jti = crypto.randomUUID();
  const famId = familyId || crypto.randomUUID();
  const expiresInSeconds = 7 * 24 * 60 * 60; // 7 days

  const token = jwt.sign(
    {
      sub: userId,
      familyId: famId,
      jti
    },
    PRIVATE_KEY,
    {
      algorithm: 'RS256',
      expiresIn: '7d',
      issuer: 'icomply-auth'
    }
  );

  return { token, jti, familyId: famId, expiresInSeconds };
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, PUBLIC_KEY, {
    algorithms: ['RS256'],
    issuer: 'icomply-auth'
  }) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, PUBLIC_KEY, {
    algorithms: ['RS256'],
    issuer: 'icomply-auth'
  }) as RefreshTokenPayload;
}
