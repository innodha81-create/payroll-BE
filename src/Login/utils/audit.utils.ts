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

function isPrivateIp(ip: string): boolean {
  if (!ip || ip === '127.0.0.1' || ip === 'localhost') return true;
  if (ip.startsWith('10.') || ip.startsWith('192.168.')) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) return true;
  return false;
}

export async function resolveGeoLocation(ip: string): Promise<{
  publicIp: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
}> {
  const isLocal = isPrivateIp(ip);

  // 1. High-precision Provider 1: ipinfo.io
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const targetUrl = isLocal
      ? 'https://ipinfo.io/json'
      : `https://ipinfo.io/${encodeURIComponent(ip)}/json`;

    const res = await fetch(targetUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data: any = await res.json();
      if (data && data.city) {
        let lat: number | null = null;
        let lon: number | null = null;
        if (data.loc) {
          const parts = data.loc.split(',');
          if (parts.length === 2) {
            lat = parseFloat(parts[0]);
            lon = parseFloat(parts[1]);
          }
        }

        const countryDisplay =
          data.country === 'IN' ? 'India' : data.country === 'SG' ? 'Singapore' : data.country || 'India';

        return {
          publicIp: data.ip || (isLocal ? null : ip),
          city: data.city || null,
          state: data.region || null,
          country: countryDisplay,
          latitude: lat,
          longitude: lon
        };
      }
    }
  } catch (err) {
    // fallback to provider 2
  }

  // 2. High-precision Provider 2: freeipapi.com
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const targetUrl = isLocal
      ? 'https://freeipapi.com/api/json'
      : `https://freeipapi.com/api/json/${encodeURIComponent(ip)}`;

    const res = await fetch(targetUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data: any = await res.json();
      if (data && data.cityName) {
        return {
          publicIp: data.ipAddress || (isLocal ? null : ip),
          city: data.cityName || null,
          state: data.regionName || null,
          country: data.countryName || 'India',
          latitude: data.latitude != null ? Number(data.latitude) : null,
          longitude: data.longitude != null ? Number(data.longitude) : null
        };
      }
    }
  } catch (err) {
    // fallback to geoip-lite
  }

  // 3. Fallback: geoip-lite for public IP
  let geo: any = null;
  if (!isLocal) {
    try {
      geo = geoip.lookup(ip);
    } catch {}
  }

  return {
    publicIp: isLocal ? null : ip,
    city: geo?.city || (isLocal ? 'Localhost' : null),
    state: geo?.region || (isLocal ? 'Local' : null),
    country: geo?.country || 'India',
    latitude: geo?.ll && geo.ll[0] != null ? Number(geo.ll[0]) : null,
    longitude: geo?.ll && geo.ll[1] != null ? Number(geo.ll[1]) : null
  };
}

export function parseClientDetails(req: Request): ClientDetails {
  const cfIp = req.headers['cf-connecting-ip'] as string;
  const realIp = req.headers['x-real-ip'] as string;
  const forwarded = req.headers['x-forwarded-for'] as string;

  let rawIp = cfIp || realIp || (forwarded ? forwarded.split(',')[0].trim() : (req.ip || req.socket.remoteAddress || '127.0.0.1'));

  if (rawIp.startsWith('::ffff:')) {
    rawIp = rawIp.replace('::ffff:', '');
  }
  if (rawIp === '::1') {
    rawIp = '127.0.0.1';
  }
  const ip = rawIp.trim();

  let city: string | null = null;
  let state: string | null = null;
  let country: string | null = null;
  let latitude: number | null = null;
  let longitude: number | null = null;

  if (!isPrivateIp(ip)) {
    const geo = geoip.lookup(ip);
    if (geo) {
      city = geo.city || null;
      state = geo.region || null;
      country = geo.country || null;
      if (geo.ll && geo.ll.length >= 2) {
        latitude = Number(geo.ll[0]);
        longitude = Number(geo.ll[1]);
      }
    }
  }

  const userAgent = (req.headers['user-agent'] as string) || 'Unknown';
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
      // Asynchronously resolve geo location with high accuracy
      const geo = await resolveGeoLocation(clientDetails.ip);

      const effectiveIp = geo.publicIp || clientDetails.ip;
      const city = geo.city || clientDetails.city || 'Madurai';
      const state = geo.state || clientDetails.state || 'Tamil Nadu';
      const country = geo.country || clientDetails.country || 'India';
      const latitude = geo.latitude ?? clientDetails.latitude;
      const longitude = geo.longitude ?? clientDetails.longitude;

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
          effectiveIp,
          city,
          state,
          country,
          latitude,
          longitude,
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
