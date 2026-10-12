import { Request } from 'express';
import geoip from 'geoip-lite';
import { UAParser } from 'ua-parser-js';
import { pool } from '../../database/db';

export interface ClientDetails {
  ip: string;
  city: string | null;
  state: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  deviceType: string;
  deviceModel: string | null;
  osName: string;
  osVersion: string | null;
  browserName: string;
  browserVersion: string | null;
  userAgent: string;
}

export function parseClientDetails(req: Request): ClientDetails {
  let ip = (
    req.headers['x-forwarded-for'] as string ||
    req.socket.remoteAddress ||
    '127.0.0.1'
  ).split(',')[0].trim();

  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    ip = '127.0.0.1';
  }

  let city: string | null = null;
  let state: string | null = null;
  let country: string | null = null;
  let latitude: number | null = null;
  let longitude: number | null = null;

  if (ip !== '127.0.0.1' && ip !== 'localhost') {
    const geo = geoip.lookup(ip);
    if (geo) {
      city = geo.city || null;
      state = geo.region || null;
      country = geo.country || null;
      if (geo.ll && geo.ll.length >= 2) {
        latitude = geo.ll[0];
        longitude = geo.ll[1];
      }
    }
  } else {
    city = 'Local Development';
    country = 'Local';
  }

  const userAgent = req.headers['user-agent'] || 'Unknown';
  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  const deviceType = result.device.type || 'Desktop';
  const deviceModel = result.device.model || (result.device.vendor ? `${result.device.vendor}` : 'PC/Mac');
  const osName = result.os.name || 'Unknown OS';
  const osVersion = result.os.version || null;
  const browserName = result.browser.name || 'Unknown Browser';
  const browserVersion = result.browser.version || null;

  return {
    ip,
    city,
    state,
    country,
    latitude,
    longitude,
    deviceType,
    deviceModel,
    osName,
    osVersion,
    browserName,
    browserVersion,
    userAgent
  };
}

export function recordAuditLog(
  userId: string | null,
  email: string,
  status: 'SUCCESS' | 'FAILED' | 'LOGOUT' | 'PASSWORD_RESET',
  clientDetails: ClientDetails,
  failureReason?: string
): void {
  setImmediate(async () => {
    try {
      await pool.query(
        `INSERT INTO login_audit_logs (
          user_id, email, status, ip_address, city, state, country,
          latitude, longitude, device_type, device_model, os_name,
          os_version, browser_name, browser_version, user_agent, failure_reason
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
        [
          userId,
          email,
          status,
          clientDetails.ip,
          clientDetails.city,
          clientDetails.state,
          clientDetails.country,
          clientDetails.latitude,
          clientDetails.longitude,
          clientDetails.deviceType,
          clientDetails.deviceModel,
          clientDetails.osName,
          clientDetails.osVersion,
          clientDetails.browserName,
          clientDetails.browserVersion,
          clientDetails.userAgent,
          failureReason || null
        ]
      );
    } catch (err) {
      console.error('[Audit Log Error]:', err);
    }
  });
}
